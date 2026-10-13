# services/usuario_service.py - SQL de usuarios y roles
import bcrypt

from database.conexion import obtener_conexion, a_diccionarios

SELECT_USUARIOS = """
    SELECT u.id_usuario, u.nombre, u.usuario, u.id_rol, r.nombre AS rol,
           u.activo, u.fecha_creacion
    FROM usuarios u
    JOIN roles r ON r.id_rol = u.id_rol
"""


def cifrar(contrasena):
    return bcrypt.hashpw(contrasena.encode(), bcrypt.gensalt()).decode()


def listar_roles():
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute("SELECT id_rol, nombre, descripcion FROM roles ORDER BY id_rol")
        return a_diccionarios(cur)


def listar(buscar=None, id_rol=None):
    sql = SELECT_USUARIOS + " WHERE 1 = 1"
    params = {}
    if buscar:
        sql += " AND (UPPER(u.nombre) LIKE UPPER(:buscar) OR u.usuario LIKE LOWER(:buscar))"
        params["buscar"] = f"%{buscar}%"
    if id_rol:
        sql += " AND u.id_rol = :id_rol"
        params["id_rol"] = id_rol
    sql += " ORDER BY u.nombre"
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(sql, params)
        return a_diccionarios(cur)


def obtener(id_usuario):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(SELECT_USUARIOS + " WHERE u.id_usuario = :id", {"id": id_usuario})
        filas = a_diccionarios(cur)
        return filas[0] if filas else None


def crear(datos):
    with obtener_conexion() as con, con.cursor() as cur:
        nuevo_id = cur.var(int)
        cur.execute(
            """INSERT INTO usuarios (nombre, usuario, contrasena, id_rol, activo)
               VALUES (:nombre, :usuario, :contrasena, :id_rol, :activo)
               RETURNING id_usuario INTO :nuevo_id""",
            {"nombre": datos.nombre, "usuario": datos.usuario,
             "contrasena": cifrar(datos.contrasena), "id_rol": datos.id_rol,
             "activo": datos.activo, "nuevo_id": nuevo_id},
        )
        con.commit()
        return obtener(nuevo_id.getvalue()[0])


def actualizar(id_usuario, datos):
    params = {"nombre": datos.nombre, "usuario": datos.usuario, "id_rol": datos.id_rol,
              "activo": datos.activo, "id": id_usuario}
    sql = "UPDATE usuarios SET nombre = :nombre, usuario = :usuario, id_rol = :id_rol, activo = :activo"
    if datos.contrasena:
        sql += ", contrasena = :contrasena"
        params["contrasena"] = cifrar(datos.contrasena)
    sql += " WHERE id_usuario = :id"
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute(sql, params)
        con.commit()
        return obtener(id_usuario) if cur.rowcount else None


def eliminar(id_usuario):
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute("DELETE FROM usuarios WHERE id_usuario = :id", {"id": id_usuario})
        con.commit()
        return cur.rowcount > 0


    

def listar_mecanicos():
    """Trabajadores activos (para asignarles trabajos)."""
    with obtener_conexion() as con, con.cursor() as cur:
        cur.execute("""SELECT u.id_usuario, u.nombre FROM usuarios u JOIN roles r ON r.id_rol = u.id_rol
                       WHERE r.nombre = 'TRABAJADOR' AND u.activo = 'S' ORDER BY u.nombre""")
        return a_diccionarios(cur)


    