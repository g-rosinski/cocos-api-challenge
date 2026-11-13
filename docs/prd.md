# PRD — Consulta de cuenta y envío de órdenes

## 1. Ficha

| | |
| --- | --- |
| Autor | Gonzalo Matias Peredo Rosinski |
| Estado | Aprobado. |
| Entrega | Una API funcional. |

## 2. Objetivos

Un inversor puede mirar su cuenta y mandar una orden al mercado, en pesos, sin que el producto simule cómo se negocia esa orden después.

La entrega está lograda cuando:

- la cuenta muestra el valor total, los pesos disponibles para operar y cada posición con su cantidad, su valor en pesos y su rendimiento total;
- se puede encontrar un activo por ticker o por nombre;
- una orden de compra o de venta queda registrada con el estado que le corresponde;
- existe una prueba que recorre el envío de una orden de punta a punta.

## 3. Contexto

El challenge pide una API con tres servicios: ver el portfolio, buscar activos y enviar una orden. Los precios están en pesos. No hay que simular el mercado ni identificar al usuario con un login.

La cuenta no tiene una lista de posiciones ya armada. Lo que el inversor posee y los pesos de los que dispone salen de los movimientos ya registrados: compras y ventas ejecutadas, depósitos y retiros. El último precio de cada activo es el cierre más reciente.

El enunciado también describe el estado "cancelada". No lo incluye entre los servicios a construir. Dice que una orden la cancela el usuario y que solo se puede cancelar una orden límite que sigue abierta. En los datos de ejemplo ya hay una orden cancelada. Ese estado importa para no contar esa orden como dinero ni como acciones. No implica un cuarto servicio.

El detalle de mensajes, códigos y tecnología queda para el RFC. Este documento dice qué tiene que poder hacer el inversor y cómo se considera correcto el resultado.

## 4. Supuestos

- La llamada indica de qué cuenta se trata. No hay registro ni contraseña.
- "Pesos disponibles para operar" descuenta el dinero apartado por una compra límite que sigue abierta. Si no se descontara, el inversor podría comprometer dos veces los mismos pesos.
- Una venta límite abierta aparta esas acciones. No se pueden vender de nuevo mientras la orden siga abierta.
- Una orden rechazada o cancelada no cambia los pesos ni la cantidad de acciones.
- Con un monto en pesos, la orden toma la mayor cantidad entera de acciones que ese monto alcanza al precio de la orden. El resto, menor a una acción, sigue disponible. No hay fracciones.
- El rendimiento total compara el valor de mercado de la posición con lo que costó armarla, usando el precio promedio. Una compra sobre una tenencia larga recalcula ese promedio. Una venta que no vacía la tenencia lo deja igual.
- El challenge no aclara que una cuenta pueda quedar con tenencia negativa. No se permite. Una venta que dejaría menos de cero acciones se rechaza. Una tenencia en cero no se muestra.
- La búsqueda acepta una parte del ticker o del nombre, sin distinguir mayúsculas. Sin texto, muestra los activos del mercado. Los pesos no son un activo: no se buscan ni se listan como posición.
- Depósitos y retiros ya vienen cargados y mueven los pesos. El inversor no los carga desde este producto.
- El retorno diario se puede calcular con el cierre y el cierre anterior, y no forma parte de lo que la cuenta tiene que mostrar. La cuenta pide el rendimiento total de la posición.

## 5. Historias de usuario

### Ver la cuenta

Como inversor, quiero ver el valor total de mi cuenta, los pesos que puedo usar para operar y los activos que tengo, para saber cómo estoy parado antes de operar.

Cada activo muestra la cantidad de acciones, el valor de esa tenencia en pesos y el rendimiento total en porcentaje. El valor total de la cuenta suma los pesos ya acreditados y el valor de mercado de las tenencias. El dinero apartado en una compra todavía abierta sigue formando parte del valor total, y no está disponible para una orden nueva.

Criterio de éxito, con la cuenta de ejemplo de Emiliano:

- Valor total: 904.784 pesos.
- Pesos disponibles para operar: 627.500.
- MetroGAS (METR): 500 acciones, valor 114.750 pesos, rendimiento −8,20 %.
- Pampa (PAMP): 40 acciones, valor 37.034 pesos, rendimiento −0,45 %.

Esos números salen de sus depósitos, retiros, compras y ventas ya ejecutadas, y de dos compras límite que siguen abiertas (Loma Negra y Banco Macro) y que solo apartan pesos. La orden cancelada y la orden rechazada de esa cuenta no cambian el resultado. Los datos incluyen una venta de Banco Macro por más acciones de las que la cuenta tenía. Esa tenencia negativa no se muestra.

### Buscar un activo

Como inversor, quiero encontrar un activo por su ticker o por su nombre, para elegir qué comprar o vender.

Criterios de éxito:

- "pamp" y "Pampa" encuentran Pampa Holding.
- Una búsqueda vacía lista los activos y no lista los pesos.
- Buscar "ARS" o "pesos" no devuelve la moneda.

### Enviar una orden

Como inversor, quiero comprar o vender un activo al precio de mercado o a un precio que yo elijo, indicando cantidad de acciones o un monto en pesos, para que la orden quede registrada con el estado correcto.

Criterios de éxito:

- Una orden a mercado no pide precio. Se toma el último precio del activo, se ejecuta en el momento y la cuenta pasa a reflejar la nueva tenencia y los nuevos pesos.
- Una orden límite pide el precio elegido por el inversor y queda abierta. La cuenta no cambia la tenencia. Si es una compra, esos pesos dejan de estar disponibles. Si es una venta, esas acciones dejan de estar disponibles.
- Si la compra supera los pesos disponibles, o la venta supera las acciones disponibles, la orden no se ejecuta y queda registrada como rechazada.
- Un monto que no alcanza para una acción también queda registrado como rechazado.
- La entrega incluye una prueba que envía una orden y muestra este comportamiento.

## 6. Interacción

No hay interfaz gráfica. El inversor usa la API a través de esos tres servicios.

1. Consulta su cuenta y lee el valor total, los pesos disponibles y sus posiciones.
2. Busca el activo por ticker o por nombre.
3. Envía la orden. Si iba a mercado y había fondos o acciones, ve la cuenta actualizada. Si era límite, ve los pesos o las acciones disponibles reducidos y la orden abierta. Si no alcanzaba, la orden queda rechazada y la cuenta no cambia.

La forma concreta de cada llamada se define en el RFC.

## 7. Preguntas

| Pregunta | Estado |
| --- | --- |
| ¿Esta entrega incluye cancelar una orden? | Cerrada. No. Ver la sección 8. |
| ¿La cuenta muestra el retorno diario? | Cerrada. No. El enunciado lo menciona como cálculo posible y pide el rendimiento total de la posición. |
| ¿Cómo se identifican los mensajes de error y qué stack se usa? | Abierta para el RFC. No cambia lo que el inversor puede hacer. |

## 8. Lo que no estamos haciendo

- **Cancelar una orden.** El resumen del challenge enumera tres servicios: portfolio, búsqueda y envío de una orden. El de backend y el de fullstack repiten esa lista. "Cancelada" es un estado del ciclo de vida: solo corresponde a una orden abierta y, en los datos de ejemplo, ya existe una. La cuenta tiene que ignorarla. Construir una acción para cancelar sería un servicio que el enunciado no pide.
- Simular el mercado o ejecutar más adelante una orden límite que quedó abierta.
- Cargar depósitos o retiros.
- Mostrar el retorno diario.
- Pedir autenticación.
- Una colección de ejemplos para invocar la API. El enunciado la marca como opcional y no es criterio de éxito de esta entrega.
