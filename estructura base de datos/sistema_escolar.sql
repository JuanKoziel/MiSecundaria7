create database `sistema_escolar` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */
/*!80016 DEFAULT ENCRYPTION='N' */;

create table `acta_alumno` (
  `id_acta_alumno` int not null auto_increment,
`id_acta` int not null,
`id_alumno` int not null,
primary key (`id_acta_alumno`),
key `id_acta` (`id_acta`),
key `id_alumno` (`id_alumno`),
constraint `acta_alumno_ibfk_1` foreign key (`id_acta`) references `actas` (`id_acta`),
constraint `acta_alumno_ibfk_2` foreign key (`id_alumno`) references `alumnos` (`id_alumno`)
) engine = InnoDB auto_increment = 11 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `acta_curso` (
  `id_acta_curso` int not null auto_increment,
`id_acta` int not null,
`id_curso` int not null,
primary key (`id_acta_curso`),
key `id_acta` (`id_acta`),
key `id_curso` (`id_curso`),
constraint `acta_curso_ibfk_1` foreign key (`id_acta`) references `actas` (`id_acta`),
constraint `acta_curso_ibfk_2` foreign key (`id_curso`) references `cursos` (`id_curso`)
) engine = InnoDB auto_increment = 9 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `acta_docente` (
  `id_acta_docente` int not null auto_increment,
`id_acta` int not null,
`id_docente` int not null,
primary key (`id_acta_docente`),
key `fk_actadoc_acta` (`id_acta`),
key `fk_actadoc_docente` (`id_docente`),
constraint `fk_actadoc_acta` foreign key (`id_acta`) references `actas` (`id_acta`) on
delete
    cascade,
    constraint `fk_actadoc_docente` foreign key (`id_docente`) references `docentes` (`id_docente`) on
    delete
        cascade
) engine = InnoDB auto_increment = 2 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `actas` (
  `id_acta` int not null auto_increment,
`id_usuario_creador` int not null,
`id_tipo_acta` int not null,
`titulo` varchar(255) default null,
`descripcion` text,
`fecha` datetime default null,
`ruta_archivo` varchar(255) default null,
primary key (`id_acta`),
key `id_usuario_creador` (`id_usuario_creador`),
key `id_tipo_acta` (`id_tipo_acta`),
constraint `actas_ibfk_1` foreign key (`id_usuario_creador`) references `usuarios` (`id_usuario`),
constraint `actas_ibfk_2` foreign key (`id_tipo_acta`) references `tipos_acta` (`id_tipo_acta`)
) engine = InnoDB auto_increment = 15 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `alumnos` (
  `id_alumno` int not null auto_increment,
`id_usuario` int default null,
`id_tutor` int default null,
`id_curso` int default null,
`nombre` varchar(100) not null,
`apellido` varchar(100) not null,
`dni` varchar(20) not null,
`fecha_nacimiento` date default null,
`direccion` varchar(255) default null,
`telefono` varchar(30) default null,
`procedencia` varchar(100) default null,
primary key (`id_alumno`),
unique key `dni` (`dni`),
unique key `id_usuario` (`id_usuario`),
key `id_tutor` (`id_tutor`),
key `id_curso` (`id_curso`),
constraint `alumnos_ibfk_1` foreign key (`id_usuario`) references `usuarios` (`id_usuario`),
constraint `alumnos_ibfk_2` foreign key (`id_tutor`) references `padres_tutores` (`id_tutor`),
constraint `alumnos_ibfk_3` foreign key (`id_curso`) references `cursos` (`id_curso`)
) engine = InnoDB auto_increment = 15 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `asistencias` (
  `id_asistencia` int not null auto_increment,
`id_alumno` int not null,
`id_curso_materia` int not null,
`id_usuario` int not null,
`id_estado_asistencia` int not null,
`fecha` date not null,
`observacion` text,
`numero_modulo` int default null,
primary key (`id_asistencia`),
key `id_alumno` (`id_alumno`),
key `id_curso_materia` (`id_curso_materia`),
key `id_usuario` (`id_usuario`),
key `id_estado_asistencia` (`id_estado_asistencia`),
constraint `asistencias_ibfk_1` foreign key (`id_alumno`) references `alumnos` (`id_alumno`),
constraint `asistencias_ibfk_2` foreign key (`id_curso_materia`) references `curso_materia` (`id_curso_materia`),
constraint `asistencias_ibfk_3` foreign key (`id_usuario`) references `usuarios` (`id_usuario`),
constraint `asistencias_ibfk_4` foreign key (`id_estado_asistencia`) references `estados_asistencia` (`id_estado_asistencia`)
) engine = InnoDB auto_increment = 103 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `auth_group` (
  `id` int not null auto_increment,
`name` varchar(150) not null,
primary key (`id`),
unique key `name` (`name`)
) engine = InnoDB default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `auth_group_permissions` (
  `id` bigint not null auto_increment,
`group_id` int not null,
`permission_id` int not null,
primary key (`id`),
unique key `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,
`permission_id`),
key `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
constraint `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` foreign key (`permission_id`) references `auth_permission` (`id`),
constraint `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` foreign key (`group_id`) references `auth_group` (`id`)
) engine = InnoDB default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `auth_permission` (
  `id` int not null auto_increment,
`name` varchar(255) not null,
`content_type_id` int not null,
`codename` varchar(100) not null,
primary key (`id`),
unique key `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,
`codename`),
constraint `auth_permission_content_type_id_2f476e4b_fk_django_co` foreign key (`content_type_id`) references `django_content_type` (`id`)
) engine = InnoDB auto_increment = 217 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `auth_user` (
  `id` int not null auto_increment,
`password` varchar(128) not null,
`last_login` datetime(6) default null,
`is_superuser` tinyint(1) not null,
`username` varchar(150) not null,
`first_name` varchar(150) not null,
`last_name` varchar(150) not null,
`email` varchar(254) not null,
`is_staff` tinyint(1) not null,
`is_active` tinyint(1) not null,
`date_joined` datetime(6) not null,
primary key (`id`),
unique key `username` (`username`)
) engine = InnoDB auto_increment = 13 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `auth_user_groups` (
  `id` bigint not null auto_increment,
`user_id` int not null,
`group_id` int not null,
primary key (`id`),
unique key `auth_user_groups_user_id_group_id_94350c0c_uniq` (`user_id`,
`group_id`),
key `auth_user_groups_group_id_97559544_fk_auth_group_id` (`group_id`),
constraint `auth_user_groups_group_id_97559544_fk_auth_group_id` foreign key (`group_id`) references `auth_group` (`id`),
constraint `auth_user_groups_user_id_6a12ed8b_fk_auth_user_id` foreign key (`user_id`) references `auth_user` (`id`)
) engine = InnoDB default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `auth_user_user_permissions` (
  `id` bigint not null auto_increment,
`user_id` int not null,
`permission_id` int not null,
primary key (`id`),
unique key `auth_user_user_permissions_user_id_permission_id_14a6b632_uniq` (`user_id`,
`permission_id`),
key `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` (`permission_id`),
constraint `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` foreign key (`permission_id`) references `auth_permission` (`id`),
constraint `auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id` foreign key (`user_id`) references `auth_user` (`id`)
) engine = InnoDB default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `calificaciones` (
  `id_calificacion` int not null auto_increment,
`id_alumno` int not null,
`id_curso_materia` int not null,
`id_docente` int not null,
`id_periodo` int not null,
`pre_nota` varchar(10) default null,
`nota_numerica` decimal(4, 2) default null,
`diagnostico` text,
`fecha_carga` datetime default null,
primary key (`id_calificacion`),
key `id_alumno` (`id_alumno`),
key `id_curso_materia` (`id_curso_materia`),
key `id_docente` (`id_docente`),
key `id_periodo` (`id_periodo`),
constraint `calificaciones_ibfk_1` foreign key (`id_alumno`) references `alumnos` (`id_alumno`),
constraint `calificaciones_ibfk_2` foreign key (`id_curso_materia`) references `curso_materia` (`id_curso_materia`),
constraint `calificaciones_ibfk_3` foreign key (`id_docente`) references `docentes` (`id_docente`),
constraint `calificaciones_ibfk_4` foreign key (`id_periodo`) references `periodos_evaluacion` (`id_periodo`)
) engine = InnoDB auto_increment = 126 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `ciclos_lectivos` (
  `id_ciclo` int not null auto_increment,
`anio` year not null,
`fecha_inicio` date default null,
`fecha_fin` date default null,
`estado` tinyint(1) default '1',
primary key (`id_ciclo`)
) engine = InnoDB auto_increment = 3 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `comunicado_archivo` (
  `id_comunicado_archivo` int not null auto_increment,
`id_comunicado` int not null,
`ruta_archivo` varchar(255) not null,
primary key (`id_comunicado_archivo`),
key `fk_comarch_com` (`id_comunicado`),
constraint `fk_comarch_com` foreign key (`id_comunicado`) references `comunicados` (`id_comunicado`) on
delete
    cascade
) engine = InnoDB auto_increment = 7 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `comunicados` (
  `id_comunicado` int not null auto_increment,
`id_usuario_creador` int default null,
`id_curso` int not null,
`id_materia` int default null,
`titulo` varchar(255) not null,
`cuerpo` text,
`fecha` datetime default null,
primary key (`id_comunicado`),
key `fk_com_curso` (`id_curso`),
key `fk_com_materia` (`id_materia`),
constraint `fk_com_curso` foreign key (`id_curso`) references `cursos` (`id_curso`) on
delete
    cascade,
    constraint `fk_com_materia` foreign key (`id_materia`) references `materias` (`id_materia`) on
    delete
        set
        null
) engine = InnoDB auto_increment = 24 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `curso_materia` (
  `id_curso_materia` int not null auto_increment,
`id_curso` int not null,
`id_materia` int not null,
`id_docente` int default null,
primary key (`id_curso_materia`),
unique key `uk_curso_materia` (`id_curso`,
`id_materia`),
key `id_materia` (`id_materia`),
key `id_docente` (`id_docente`),
constraint `curso_materia_ibfk_1` foreign key (`id_curso`) references `cursos` (`id_curso`),
constraint `curso_materia_ibfk_2` foreign key (`id_materia`) references `materias` (`id_materia`),
constraint `curso_materia_ibfk_3` foreign key (`id_docente`) references `docentes` (`id_docente`)
) engine = InnoDB auto_increment = 209 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `cursos` (
  `id_curso` int not null auto_increment,
`id_preceptor` int default null,
`id_ciclo` int default null,
`nombre_curso` varchar(50) not null,
`turno` varchar(50) default null,
primary key (`id_curso`),
key `id_preceptor` (`id_preceptor`),
key `id_ciclo` (`id_ciclo`),
constraint `cursos_ibfk_1` foreign key (`id_preceptor`) references `preceptores` (`id_preceptor`),
constraint `cursos_ibfk_2` foreign key (`id_ciclo`) references `ciclos_lectivos` (`id_ciclo`)
) engine = InnoDB auto_increment = 20 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `ddjj_docente` (
  `id_ddjj` int not null auto_increment,
`id_docente` int not null,
`ruta_archivo` varchar(255) not null,
`fecha_carga` datetime not null default current_timestamp,
primary key (`id_ddjj`),
unique key `uq_ddjj_docente` (`id_docente`),
constraint `fk_ddjj_docente` foreign key (`id_docente`) references `docentes` (`id_docente`) on
delete
    cascade
) engine = InnoDB default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `diagnosticos_grupales` (
  `id_diagnostico_grupal` int not null auto_increment,
`id_curso` int not null,
`id_docente` int not null,
`fecha` date default null,
`descripcion` text,
primary key (`id_diagnostico_grupal`),
key `id_curso` (`id_curso`),
key `id_docente` (`id_docente`),
constraint `diagnosticos_grupales_ibfk_1` foreign key (`id_curso`) references `cursos` (`id_curso`),
constraint `diagnosticos_grupales_ibfk_2` foreign key (`id_docente`) references `docentes` (`id_docente`)
) engine = InnoDB auto_increment = 4 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `directivos` (
  `id_directivo` int not null auto_increment,
`id_usuario` int default null,
`nombre` varchar(100) not null,
`apellido` varchar(100) not null,
`dni` varchar(20) not null,
`telefono` varchar(30) default null,
`cargo` varchar(100) default null,
primary key (`id_directivo`),
unique key `dni` (`dni`),
unique key `id_usuario` (`id_usuario`),
constraint `directivos_ibfk_1` foreign key (`id_usuario`) references `usuarios` (`id_usuario`)
) engine = InnoDB auto_increment = 10 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `django_admin_log` (
  `id` int not null auto_increment,
`action_time` datetime(6) not null,
`object_id` longtext,
`object_repr` varchar(200) not null,
`action_flag` smallint unsigned not null,
`change_message` longtext not null,
`content_type_id` int default null,
`user_id` int not null,
primary key (`id`),
key `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
key `django_admin_log_user_id_c564eba6_fk_auth_user_id` (`user_id`),
constraint `django_admin_log_content_type_id_c4bce8eb_fk_django_co` foreign key (`content_type_id`) references `django_content_type` (`id`),
constraint `django_admin_log_user_id_c564eba6_fk_auth_user_id` foreign key (`user_id`) references `auth_user` (`id`),
constraint `django_admin_log_chk_1` check ((`action_flag` >= 0))
) engine = InnoDB default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `django_content_type` (
  `id` int not null auto_increment,
`app_label` varchar(100) not null,
`model` varchar(100) not null,
primary key (`id`),
unique key `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,
`model`)
) engine = InnoDB auto_increment = 55 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `django_migrations` (
  `id` bigint not null auto_increment,
`app` varchar(255) not null,
`name` varchar(255) not null,
`applied` datetime(6) not null,
primary key (`id`)
) engine = InnoDB auto_increment = 22 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `django_session` (
  `session_key` varchar(40) not null,
`session_data` longtext not null,
`expire_date` datetime(6) not null,
primary key (`session_key`),
key `django_session_expire_date_a5c62663` (`expire_date`)
) engine = InnoDB default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `docentes` (
  `id_docente` int not null auto_increment,
`id_usuario` int default null,
`nombre` varchar(100) not null,
`apellido` varchar(100) not null,
`dni` varchar(20) not null,
`correo` varchar(100) default null,
`telefono` varchar(30) default null,
primary key (`id_docente`),
unique key `dni` (`dni`),
unique key `id_usuario` (`id_usuario`),
constraint `docentes_ibfk_1` foreign key (`id_usuario`) references `usuarios` (`id_usuario`)
) engine = InnoDB auto_increment = 5 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `estados_asistencia` (
  `id_estado_asistencia` int not null auto_increment,
`nombre_estado` varchar(50) not null,
primary key (`id_estado_asistencia`),
unique key `nombre_estado` (`nombre_estado`)
) engine = InnoDB auto_increment = 5 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `historial_cambios` (
  `id_historial` int not null auto_increment,
`id_usuario` int not null,
`id_tipo_accion` int not null,
`tabla_modificada` varchar(100) default null,
`id_registro` int default null,
`valor_anterior` text,
`valor_nuevo` text,
`fecha` datetime default null,
primary key (`id_historial`),
key `id_usuario` (`id_usuario`),
key `id_tipo_accion` (`id_tipo_accion`),
constraint `historial_cambios_ibfk_1` foreign key (`id_usuario`) references `usuarios` (`id_usuario`),
constraint `historial_cambios_ibfk_2` foreign key (`id_tipo_accion`) references `tipos_accion` (`id_tipo_accion`)
) engine = InnoDB default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `horarios` (
  `id_horario` int not null auto_increment,
`id_curso_materia` int not null,
`dia_semana` varchar(20) default null,
`hora_inicio` time default null,
`hora_fin` time default null,
`aula` varchar(50) default null,
`numero_modulo` int default null,
primary key (`id_horario`),
key `id_curso_materia` (`id_curso_materia`),
constraint `horarios_ibfk_1` foreign key (`id_curso_materia`) references `curso_materia` (`id_curso_materia`)
) engine = InnoDB auto_increment = 24 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `inscripciones_materias` (
  `id_inscripcion` int not null auto_increment,
`id_alumno` int not null,
`id_curso_materia` int not null,
`estado` varchar(50) default null,
`fecha_inscripcion` date default null,
primary key (`id_inscripcion`),
key `id_alumno` (`id_alumno`),
key `id_curso_materia` (`id_curso_materia`),
constraint `inscripciones_materias_ibfk_1` foreign key (`id_alumno`) references `alumnos` (`id_alumno`),
constraint `inscripciones_materias_ibfk_2` foreign key (`id_curso_materia`) references `curso_materia` (`id_curso_materia`)
) engine = InnoDB auto_increment = 19 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `materias` (
  `id_materia` int not null auto_increment,
`nombre_materia` varchar(100) not null,
`descripcion` text,
primary key (`id_materia`)
) engine = InnoDB auto_increment = 33 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `notificaciones` (
  `id_notificacion` int not null auto_increment,
`id_usuario` int not null,
`titulo` varchar(255) default null,
`mensaje` text,
`fecha` datetime default null,
`leida` tinyint(1) default '0',
primary key (`id_notificacion`),
key `id_usuario` (`id_usuario`),
constraint `notificaciones_ibfk_1` foreign key (`id_usuario`) references `usuarios` (`id_usuario`)
) engine = InnoDB auto_increment = 4 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `padres_tutores` (
  `id_tutor` int not null auto_increment,
`id_usuario` int default null,
`nombre` varchar(100) not null,
`apellido` varchar(100) not null,
`dni` varchar(20) not null,
`telefono` varchar(30) default null,
`direccion` varchar(255) default null,
primary key (`id_tutor`),
unique key `dni` (`dni`),
unique key `id_usuario` (`id_usuario`),
constraint `padres_tutores_ibfk_1` foreign key (`id_usuario`) references `usuarios` (`id_usuario`)
) engine = InnoDB auto_increment = 4 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `periodos_evaluacion` (
  `id_periodo` int not null auto_increment,
`nombre_periodo` varchar(100) default null,
`orden_periodo` int default null,
primary key (`id_periodo`)
) engine = InnoDB auto_increment = 4 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `planificaciones` (
  `id_planificacion` int not null auto_increment,
`id_docente` int not null,
`id_curso_materia` int not null,
`titulo` varchar(255) default null,
`descripcion` text,
`ruta_archivo` varchar(255) default null,
`fecha_subida` datetime default null,
primary key (`id_planificacion`),
key `id_docente` (`id_docente`),
key `id_curso_materia` (`id_curso_materia`),
constraint `planificaciones_ibfk_1` foreign key (`id_docente`) references `docentes` (`id_docente`),
constraint `planificaciones_ibfk_2` foreign key (`id_curso_materia`) references `curso_materia` (`id_curso_materia`)
) engine = InnoDB auto_increment = 4 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `preceptores` (
  `id_preceptor` int not null auto_increment,
`id_usuario` int default null,
`nombre` varchar(100) not null,
`apellido` varchar(100) not null,
`dni` varchar(20) not null,
`correo` varchar(100) default null,
`telefono` varchar(30) default null,
primary key (`id_preceptor`),
unique key `dni` (`dni`),
unique key `id_usuario` (`id_usuario`),
constraint `preceptores_ibfk_1` foreign key (`id_usuario`) references `usuarios` (`id_usuario`)
) engine = InnoDB auto_increment = 8 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `roles` (
  `id_rol` int not null auto_increment,
`nombre_rol` varchar(50) not null,
primary key (`id_rol`),
unique key `nombre_rol` (`nombre_rol`)
) engine = InnoDB auto_increment = 7 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `tipos_accion` (
  `id_tipo_accion` int not null auto_increment,
`nombre_accion` varchar(50) not null,
primary key (`id_tipo_accion`),
unique key `nombre_accion` (`nombre_accion`)
) engine = InnoDB default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `tipos_acta` (
  `id_tipo_acta` int not null auto_increment,
`nombre_tipo` varchar(50) not null,
primary key (`id_tipo_acta`),
unique key `nombre_tipo` (`nombre_tipo`)
) engine = InnoDB auto_increment = 5 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `usuario_roles` (
  `id_usuario` int not null,
`id_rol` int not null,
primary key (`id_usuario`,
`id_rol`),
key `id_rol` (`id_rol`),
constraint `usuario_roles_ibfk_1` foreign key (`id_usuario`) references `usuarios` (`id_usuario`),
constraint `usuario_roles_ibfk_2` foreign key (`id_rol`) references `roles` (`id_rol`)
) engine = InnoDB default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create table `usuarios` (
  `id_usuario` int not null auto_increment,
`usuario` varchar(50) not null,
`contrasena` varchar(255) not null,
`estado` tinyint(1) default '1',
`ultimo_acceso` datetime default null,
`fecha_deshabilitacion_programada` datetime default null,
`fecha_habilitacion_programada` datetime default null,
primary key (`id_usuario`),
unique key `usuario` (`usuario`)
) engine = InnoDB auto_increment = 23 default CHARSET = utf8mb4 collate = utf8mb4_0900_ai_ci;

create database `sistema_escolar` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */
/*!80016 DEFAULT ENCRYPTION='N' */;

create database `sistema_escolar` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */
/*!80016 DEFAULT ENCRYPTION='N' */;

create database `sistema_escolar` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */
/*!80016 DEFAULT ENCRYPTION='N' */;

create database `sistema_escolar` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */
/*!80016 DEFAULT ENCRYPTION='N' */;

create database `sistema_escolar` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */
/*!80016 DEFAULT ENCRYPTION='N' */;

create database `sistema_escolar` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */
/*!80016 DEFAULT ENCRYPTION='N' */;
