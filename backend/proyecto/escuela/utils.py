def activar_o_crear(model_class, lookup, defaults):
    try:
        existing = model_class.objects.filter(**lookup, activo=False).first()
        if existing:
            for k, v in defaults.items():
                setattr(existing, k, v)
            existing.activo = True
            existing.save()
            return existing, True
    except AttributeError:
        pass
    return model_class.objects.create(**lookup, **defaults, activo=True), False
