from escuela.usuario_estado import aplicar_programaciones_usuario


class UsuarioEstadoProgramadoMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        aplicar_programaciones_usuario()
        return self.get_response(request)

