from django.contrib import admin

from .models import (
    ActaAlumno,
    ActaCurso,
    Alumno,
    AsistenciaClase,
    AsistenciaDiaria,
    Calificacion,
    Comunicado,
    NotaPreceptor,
    Perfil,
    SesionClase,
    VinculoFamilia,
)

admin.site.register(Perfil)
admin.site.register(Alumno)
admin.site.register(VinculoFamilia)
admin.site.register(Calificacion)
admin.site.register(AsistenciaDiaria)
admin.site.register(NotaPreceptor)
admin.site.register(SesionClase)
admin.site.register(AsistenciaClase)
admin.site.register(ActaCurso)
admin.site.register(ActaAlumno)
admin.site.register(Comunicado)
