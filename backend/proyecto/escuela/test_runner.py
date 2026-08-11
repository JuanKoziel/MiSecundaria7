"""Test runner de la escuela.

Los modelos de la app `escuela` usan `managed = False` y no tienen
migraciones que creen tablas (las tablas existen solo en la base real).
Por eso `manage.py test` no puede usar el esquema estándar de Django:
Django crea la base de testing vacía.

Este runner copia SOLO la estructura (CREATE TABLE) de la base real al
test DB después de que Django la crea, de modo que los tests corren sobre
un esquema idéntico al de producción pero sin datos reales. Nunca se
escribe sobre la base real.
"""

import MySQLdb

from django.conf import settings
from django.db import connections
from django.test.runner import DiscoverRunner


class EscuelaDiscoverRunner(DiscoverRunner):
    """DiscoverRunner que replica el esquema real en el test database."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # La config real se captura ANTES de que Django renombre la base a
        # `test_*` durante la creación del test DB.
        self._real_db_settings = dict(settings.DATABASES['default'])
        self._real_db_settings['OPTIONS'] = dict(
            settings.DATABASES['default'].get('OPTIONS') or {}
        )

    def setup_databases(self, **kwargs):
        old_config = super().setup_databases(**kwargs)
        self._copiar_esquema()
        return old_config

    def _conectar_real(self):
        cfg = self._real_db_settings
        return MySQLdb.connect(
            host=cfg.get('HOST') or 'localhost',
            port=int(cfg['PORT']) if cfg.get('PORT') else 3306,
            user=cfg.get('USER') or 'root',
            passwd=cfg.get('PASSWORD') or '',
            db=cfg['NAME'],
            charset=cfg.get('OPTIONS', {}).get('charset', 'utf8mb4'),
        )

    def _copiar_esquema(self):
        test_conn = connections['default']
        test_name = test_conn.settings_dict['NAME']

        if not self._real_db_settings['NAME'] or test_name is None:
            return

        real = self._conectar_real()
        try:
            cur_real = real.cursor()
            cur_test = test_conn.cursor()

            cur_test.execute('SHOW TABLES')
            existentes = {row[0] for row in cur_test.fetchall()}

            cur_real.execute('SHOW TABLES')
            tablas = sorted(row[0] for row in cur_real.fetchall())

            cur_test.execute('SET FOREIGN_KEY_CHECKS=0')
            for tabla in tablas:
                if tabla in existentes:
                    continue
                cur_real.execute(f'SHOW CREATE TABLE `{tabla}`')
                fila = cur_real.fetchone()
                if not fila:
                    continue
                ddl = fila[1]
                cur_test.execute(ddl)
            cur_test.execute('SET FOREIGN_KEY_CHECKS=1')
        finally:
            real.close()
