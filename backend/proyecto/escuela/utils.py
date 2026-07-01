def normalizar_dni(value):
    if not value:
        return value
    digits = ''.join(c for c in str(value) if c.isdigit())
    if not digits:
        return value
    if len(digits) <= 3:
        return digits
    last3 = digits[-3:]
    rest = digits[:-3]
    if len(rest) <= 3:
        return f'{rest}.{last3}'
    next3 = rest[-3:]
    first = rest[:-3]
    return f'{first}.{next3}.{last3}'

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
