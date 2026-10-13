# 🏍️ El Hospital — Sistema de gestión para taller de motos

Aplicación web **Full Stack** para administrar un taller de motos: clientes y sus motos, inventario de repuestos, trabajos de los mecánicos, ventas (repuestos + mano de obra), compras a proveedores, reportes y una bitácora de actividad.

> Proyecto Integrador de Desarrollo Web — Frontend + API REST + Oracle Database.

---

## 1. Problema que resuelve

En un taller pequeño todo se anota en cuadernos o en WhatsApp. Por eso:

- no se sabe cuántos repuestos quedan ni cuándo hay que comprar,
- se pierde qué trabajo le toca a cada mecánico y en qué va,
- no se sabe cuánto se vendió en repuestos y cuánto en mano de obra,
- el dueño no se entera de lo que pasa cuando no está.

**El Hospital** centraliza todo esto en una aplicación con **roles**: el administrador ve todo, la vendedora maneja ventas e inventario y asigna trabajos, y cada mecánico ve **solo sus trabajos**.

---

## 2. Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (`fetch`), Bootstrap 5.3 y Bootstrap Icons |
| Backend | Python 3.13 + **FastAPI** + Pydantic |
| Base de datos | **Oracle Database 26ai Free** (en Docker) con el driver oficial `oracledb` |
| Seguridad | Contraseñas cifradas con **bcrypt**, token Bearer y permisos por rol |
| Documentación de la API | Swagger / OpenAPI (automática en `/docs`) |
| Control de versiones | Git y GitHub |

**Flujo:** `Usuario → Frontend → API REST (FastAPI) → Oracle → API REST → Frontend`

El frontend **nunca** se conecta directo a Oracle: siempre pasa por la API.

---

## 3. Módulos

| Módulo | Qué hace |
|---|---|
| **Login** | Inicio de sesión con usuario y contraseña (bcrypt) |
| **Inicio (Dashboard)** | Indicadores calculados en el backend: ventas, stock bajo, trabajos por estado |
| **Clientes y motos** | CRUD de clientes y de sus motos (placa, marca, modelo, apodo) |
| **Repuestos** | CRUD del inventario, búsqueda, filtros por categoría/marca y alerta de stock bajo |
| **Trabajos** | Órdenes de trabajo asignadas a mecánicos, con estados PENDIENTE → EN PROCESO → TERMINADO y filtros |
| **Ventas y compras** | Venta unificada (repuestos + mano de obra en un solo registro, en una transacción) y compras a proveedores que suben el stock |
| **Catálogo** | Categorías, marcas y tipos de trabajo (con precio sugerido) |
| **Usuarios** | CRUD de usuarios y asignación de roles (solo administrador) |
| **Reportes** | Ventas por mes, repuestos más vendidos, trabajos por mecánico y flujo de caja |
| **Actividad del taller** | Bitácora automática: quién vendió, asignó o terminó qué, y cuándo |

### Roles y permisos

| Acción | Administrador | Vendedor | Trabajador |
|---|:---:|:---:|:---:|
| Ver dashboard | ✅ | ✅ | ✅ |
| Clientes y motos | ✅ | ✅ | ❌ |
| Crear/editar repuestos, categorías, marcas y tipos | ✅ | ✅ | ❌ |
| Asignar trabajos a mecánicos | ✅ | ✅ | ❌ |
| Ver y avanzar trabajos | Todos | Todos | **Solo los suyos** |
| Registrar ventas y compras | ✅ | ✅ | ❌ |
| Eliminar / anular registros | ✅ | ❌ | ❌ |
| Usuarios, reportes y bitácora | ✅ | ❌ | ❌ |

---

## 4. Estructura del repositorio

```
proyecto-taller/
├── frontend/
│   ├── index.html          ← Dashboard
│   ├── login.html
│   ├── pages/              ← clientes, repuestos, trabajos, movimientos (ventas), catalogo, usuarios, reportes
│   ├── css/                ← estilos.css, login.css
│   ├── js/                 ← api.js (fetch + sesión), layout.js (menú y funciones comunes), un .js por página
│   └── assets/             ← fotos
├── backend/
│   ├── main.py             ← arranca FastAPI, CORS, rutas y manejo de errores de Oracle
│   ├── routers/            ← endpoints (URLs) y permisos por rol
│   ├── services/           ← consultas SQL a Oracle
│   ├── schemas/            ← validación de datos con Pydantic
│   ├── models/
│   ├── database/           ← conexion.py (lee las credenciales del .env)
│   ├── requirements.txt
│   ├── .env.example        ← plantilla de credenciales (el .env real NO se sube)
│   └── iniciar_api.bat     ← prende la API con Docker
├── database/
│   ├── 01_tables.sql       ← creación de tablas
│   ├── 02_constraints.sql  ← PK, FK, UNIQUE y CHECK
│   ├── 03_data.sql         ← datos iniciales de prueba
│   ├── 04_queries.sql      ← consultas del dashboard y reportes
│   ├── 05_actualizacion_ventas.sql
│   ├── 06_actividad.sql
│   └── 07_tipos_trabajo.sql
├── docs/                   ← análisis, diseño de BD, diagramas y decisiones
├── tests/                  ← evidencias de pruebas
├── README.md
└── .gitignore
```

---

## 5. Base de datos (12 tablas)

`roles`, `usuarios`, `clientes`, `motos_cliente`, `categorias`, `marcas`, `repuestos`, `tipos_trabajo`, `trabajos`, `ventas`, `movimientos` y `actividad`.

Tiene llaves primarias, llaves foráneas, `UNIQUE` (placa, referencia, usuario) y `CHECK` (stock ≥ 0, precio > 0, estados válidos). Los diagramas están en `docs/`.

---

## 6. Instalación y ejecución

### Requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)
- [Visual Studio Code](https://code.visualstudio.com/) con la extensión **Live Server**

### Paso 1 — Clonar el proyecto
```bash
git clone https://github.com/juansito606/proyecto-taller.git
cd proyecto-taller
```

### Paso 2 — Prender Oracle en Docker
```bash
docker run -d --name oracle-taller -p 1522:1521 -e ORACLE_PWD=ClaveAdmin123 container-registry.oracle.com/database/free:latest
```
Espera unos minutos hasta que `docker logs oracle-taller` diga **DATABASE IS READY TO USE**.

Luego crea el usuario del taller:
```bash
docker exec -it oracle-taller sqlplus sys/ClaveAdmin123@FREEPDB1 as sysdba
```
```sql
CREATE USER taller IDENTIFIED BY Taller2026;
GRANT CONNECT, RESOURCE, UNLIMITED TABLESPACE TO taller;
exit
```

### Paso 3 — Crear las tablas y cargar los datos (en orden)
```bash
docker cp database\. oracle-taller:/tmp/
docker exec -it oracle-taller sqlplus taller/Taller2026@FREEPDB1 @/tmp/01_tables.sql
docker exec -it oracle-taller sqlplus taller/Taller2026@FREEPDB1 @/tmp/02_constraints.sql
docker exec -it oracle-taller sqlplus taller/Taller2026@FREEPDB1 @/tmp/03_data.sql
docker exec -it oracle-taller sqlplus taller/Taller2026@FREEPDB1 @/tmp/06_actividad.sql
docker exec -it oracle-taller sqlplus taller/Taller2026@FREEPDB1 @/tmp/07_tipos_trabajo.sql
```
(Después de cada script escribe `exit` para salir de sqlplus. El `05_actualizacion_ventas.sql` solo sirve para actualizar bases creadas con la versión anterior; en una instalación nueva no se usa.)

### Paso 4 — Configurar las credenciales
Copia `backend/.env.example` como `backend/.env` y escribe la contraseña real:
```
DB_USER=taller
DB_PASSWORD=Taller2026
DB_DSN=localhost:1522/FREEPDB1
```

### Paso 5 — Prender la API
Doble clic en `backend/iniciar_api.bat` (o desde la terminal: `backend\iniciar_api.bat`).
Cuando salga **Application startup complete**, la API está lista:

- API: http://127.0.0.1:8000
- **Swagger:** http://127.0.0.1:8000/docs

### Paso 6 — Abrir el frontend
En VS Code, clic derecho sobre `frontend/login.html` → **Open with Live Server**.
Se abre en `http://127.0.0.1:5500/frontend/login.html`.

### Usuarios de prueba

| Usuario | Contraseña | Rol |
|---|---|---|
| juan | admin123 | Administrador |
| sofia | vend123 | Vendedor |
| andres | trab123 | Trabajador |
| camilo | trab123 | Trabajador |

---

## 7. API REST (resumen)

Todas las rutas empiezan por `/api` y, salvo el login, necesitan el token (`Authorization: Bearer <token>`).

| Recurso | Endpoints |
|---|---|
| Autenticación | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` |
| Usuarios y roles | `GET/POST /usuarios`, `GET/PUT/DELETE /usuarios/{id}`, `GET /usuarios/mecanicos`, `GET /roles` |
| Clientes | `GET/POST /clientes`, `GET/PUT/DELETE /clientes/{id}` |
| Motos | `GET/POST /motos`, `GET/PUT/DELETE /motos/{id}` |
| Categorías | `GET/POST /categorias`, `GET/PUT/DELETE /categorias/{id}` |
| Marcas | `GET/POST /marcas`, `GET/PUT/DELETE /marcas/{id}` |
| Tipos de trabajo | `GET/POST /tipos-trabajo`, `GET/PUT/DELETE /tipos-trabajo/{id}` |
| Repuestos | `GET/POST /repuestos`, `GET/PUT/DELETE /repuestos/{id}` |
| Trabajos | `GET/POST /trabajos`, `GET/PUT/DELETE /trabajos/{id}` |
| Ventas | `GET/POST /ventas`, `GET/DELETE /ventas/{id}` |
| Movimientos (compras) | `GET/POST /movimientos`, `GET/DELETE /movimientos/{id}` |
| Dashboard y reportes | `GET /dashboard`, `GET /reportes/ventas-por-mes`, `/repuestos-mas-vendidos`, `/trabajos-por-trabajador`, `/flujo-caja` |
| Actividad | `GET /actividad` |

**Códigos HTTP usados:** `200` OK · `201` creado · `400` dato inválido o regla de Oracle · `401` sin sesión · `403` sin permiso · `404` no existe · `422` validación de Pydantic · `500` error interno (sin mostrar detalles técnicos).

---

## 8. Seguridad y validaciones

- Contraseñas guardadas con **bcrypt** (nunca en texto plano).
- Credenciales de Oracle en **variables de entorno** (`.env`, ignorado por Git).
- Permisos por rol en **cada endpoint** del backend (no solo se esconden botones en el frontend).
- Validación en 3 niveles: **formularios HTML** → **Pydantic** en FastAPI → **restricciones** en Oracle.
- Los errores de Oracle se traducen a mensajes claros (por ejemplo: "No se puede eliminar porque tiene registros asociados").
- Protección XSS: todo texto se escapa antes de mostrarlo (`esc()` en `layout.js`).

---

## 9. Pruebas

Las evidencias (capturas) están en `tests/`: login, crear, consultar, actualizar, eliminar, datos incorrectos, control de acceso por rol y endpoints probados en Swagger.

---

## 10. Integrante

| Nombre | Responsabilidades |
|---|---|
| **Juan Esteban Izquierdo** | Análisis y requisitos, diseño de la base de datos, scripts SQL, backend en FastAPI, frontend, pruebas, documentación y sustentación |


