# feat: instrumentar llamadas con atributos de OpenTelemetry sin un vendor

## 1. Contexto y objetivo

- **Propósito:** Dejar atributos propios en cada llamada para poder armar alertas después, sin enviar datos a un servicio pago.
- **Alcance (In-Scope):** Atributos de OpenTelemetry por llamada y, en una orden, lado, tipo y estado resultante. Export preparado, sin vendor.
- **Fuera de alcance (Out-of-Scope):** Dashboards, alertas, un collector de pago y New Relic.

## 2. Requisitos técnicos y restricciones

- **Stack / Tecnologías:** SDK de OpenTelemetry para Node.js. Los paquetes concretos y sus versiones se verifican al implementar. No se instala un exportador de New Relic.
- **Restricciones estrictas:**
  - Sin asunciones: no se elige un backend de traces en este ticket.
  - Atributos de toda llamada: `correlationId`, ruta y estado HTTP. `userId` solo cuando la llamada lo tiene.
  - En una orden se agregan lado, tipo y estado resultante.
  - Ningún atributo contiene `email` ni `accountNumber`.

## 3. Archivos y recursos de referencia

- **Archivos a modificar/crear:** inicialización del SDK junto a `src/main.ts`, y el punto donde el interceptor o el módulo de órdenes agrega atributos.
- **Firma / Contrato propuesto:**

```typescript
type RequestAttributes = {
  correlationId: string;
  route: string;
  httpStatus: number;
  userId?: number;
};

type OrderAttributes = RequestAttributes & {
  orderSide: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT';
  orderStatus: 'FILLED' | 'NEW' | 'REJECTED';
};
```

Fuente técnica: sección 7 de [docs/rfc.md](../rfc.md).

## 4. Instrucciones paso a paso

1. **Plan de cambios (Preview):** Listar los atributos y confirmar que no hay exportador de un vendor, antes de instalar paquetes.
2. **Implementación:** Inicializar el SDK. Copiar el `correlationId` de TASK-03. Agregar los atributos de la orden al cerrar `POST /orders`.
3. **Documentación:** Anotar en la sección 7 del RFC los nombres finales de los paquetes verificados.

## 5. Resultados esperados y verificación

- [x] **Comprobaciones manuales:** Una orden emitida deja esos atributos asociados al `correlationId` de la llamada. Una búsqueda no incluye `userId`.
- [x] **Escenarios de test (Unitarios / E2E):** Prueba unitaria de que el conjunto de atributos de una orden no contiene email ni número de cuenta.
- [x] **Documentación:** La sección 7 del RFC sigue diciendo que New Relic no se usa.

## Dependencias

TASK-03, TASK-06.
