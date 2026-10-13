# services/actividad_service.py - Bitácora del taller: quién hizo qué y cuándo
from database.conexion import obtener_conexion, a_diccionarios


def pesos(valor):
    """45000 -> '$45.000'"""
    return "$" + f"{valor or 0:,.0f}".replace(",", ".")


def moto(marca, modelo, placa, apodo=None, cliente=None):
    """-> 'moto Hero Hunk 125 (JCI56I «Rodolfa») de Juan Izquierdo'"""
    texto = f"moto {marca} {modelo} ({placa}" + (f" «{apodo}»" if apodo else "") + ")"
    return texto + (f" de {cliente}" if cliente else "")


def registrar(id_usuario, tipo, accion, detalle="", monto=None):
    """Anota una línea en la bitácora. Si falla, NO daña la venta/trabajo que se acaba de guardar."""
    try:
        with obtener_conexion() as con, con.cursor() as cur:
            cur.execute(
                """INSERT INTO actividad (id_usuario, tipo, accion, detalle, monto)
                   VALUES (:id_usuario, :tipo, :accion, :detalle, :monto)""",
                {"id_usuario": id_usuario, "tipo": tipo, "accion": accion[:200],
                 "detalle": (detalle or "")[:1000], "monto": monto})
            con.commit()
    except Exception as error:
        print("No se pudo registrar la actividad:", error)


def listar(despues_de=0, limite=40):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute("""
            SELECT * FROM (
                SELECT a.id_actividad, a.fecha, a.tipo, a.accion, a.detalle, a.monto,
                       a.id_usuario, u.nombre AS usuario, r.nombre AS rol
                FROM actividad a
                JOIN usuarios u ON u.id_usuario = a.id_usuario
                JOIN roles r    ON r.id_rol     = u.id_rol
                WHERE a.id_actividad > :despues_de
                ORDER BY a.id_actividad DESC)
            WHERE ROWNUM <= :limite""", {"despues_de": despues_de, "limite": limite})
        return a_diccionarios(cur)

    