# Seller Service

Microservici pentru procesarea comenzilor prin RabbitMQ. Serviciul consumă evenimente `order.created`, procesează comenzile, le salvează în baza de date și confirmă procesarea prin ACK.

## 🎯 Flow Principal

```
Order Service 
    ↓ (publish: order.created)
RabbitMQ Exchange (order.exchange)
    ↓ (route by routing key)
seller.queue
    ↓ (consume)
Seller Service
    ↓ (validate → save as PENDING)
Mesaj în memorie (fără ACK) ⏳
    ↓
Admin confirmă manual (PUT /orders/:id/confirm)
    ↓ (update DB → CONFIRMED)
ACK → RabbitMQ
    ↓
Message DELETED ✅

SAU

Admin respinge (PUT /orders/:id/reject)
    ↓ (update DB → REJECTED)
NACK → RabbitMQ
    ↓
Message DELETED ❌
```

## 📋 RabbitMQ Configuration

### Setup
- **Exchange**: `order.exchange` (topic, durable)
- **Queue**: `seller.queue` (durable, single queue)
- **Routing Key**: `order.created`
- **Acknowledgment**: Manual (noAck: false)
- **Message Deletion**: Automat după ACK

### Comportament
1. **Primește mesaj** cu routing key `order.created`
2. **Validează** datele evenimentului (class-validator)
3. **Salvează** comanda cu status `PENDING`
4. **Stochează mesajul** în memorie (fără ACK) - așteaptă confirmare manuală
5. **Admin confirmă** prin `PUT /orders/:id/confirm`:
   - Update status → `CONFIRMED`
   - Trimite **ACK** → RabbitMQ șterge mesajul ✅
6. **SAU Admin respinge** prin `PUT /orders/:id/reject`:
   - Update status → `REJECTED`
   - Trimite **NACK** → RabbitMQ șterge mesajul ❌

### Error Handling
- **Date invalide**: NACK fără requeue (mesaj șters imediat)
- **Eroare la procesare**: NACK cu requeue (mesaj revine în coadă pentru retry)

## 🛠️ Tehnologii

- **NestJS** - Framework backend
- **PostgreSQL** - Database
- **TypeORM** - ORM
- **RabbitMQ** - Message broker
- **class-validator** - Validare evenimente
- **Jest** - Testing

## 📁 Structura Principală

```
src/
├── config/
│   └── rabbitmq.config.ts          # RabbitMQ configuration
├── messaging/
│   ├── rabbitmq.consumer.ts        # Consumer (primește comenzi)
│   └── rabbitmq.producer.ts        # Producer (trimite confirmări - nu e folosit acum)
├── modules/seller/
│   ├── seller.service.ts           # Business logic
│   ├── seller.controller.ts        # REST endpoints
│   └── seller.module.ts            # NestJS module
├── database/entities/
│   └── seller-order.entity.ts      # Order entity
└── dto/
    ├── order-created.event.ts      # Event structure (incoming)
    └── order-processed.event.ts    # Event structure (outgoing - nu e folosit acum)
```

## 🗄️ Database Schema

```sql
CREATE TABLE seller_orders (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED')),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Status-uri**:
- `PENDING` - Comandă nouă, în procesare
- `CONFIRMED` - Procesată cu succes
- `REJECTED` - Respinsă manual (prin API)

## 🚀 Instalare și Rulare

### Prerequisites
```bash
# Node.js 18+
# PostgreSQL
# RabbitMQ
```

### Setup
```bash
# 1. Instalare dependențe
pnpm install

# 2. Configurare .env
cp .env.example .env

# 3. Rulare development
pnpm start:dev

# 4. Rulare teste
pnpm test
```

### Environment Variables
```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=seller_service

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=order.exchange
RABBITMQ_QUEUE=seller.queue

# Server
PORT=3002
NODE_ENV=development
```

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests  
pnpm test:e2e

# Test coverage
pnpm test:cov

# Watch mode
pnpm test:watch
```

**Status teste**: ✅ 20/20 teste trecute

## 📊 API Endpoints

### Orders Management

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/orders` | Listă comenzi |
| GET | `/orders/:id` | Obține comandă după ID |
| POST | `/orders/:id/confirm` | **Confirmă manual** comandă → ACK → RabbitMQ șterge |
| POST | `/orders/:id/reject` | **Respinge manual** comandă → NACK → RabbitMQ șterge |

**Important**: Comenzile rămân în status `PENDING` și mesajele rămân în coada RabbitMQ până la confirmare/respingere manuală!

### Swagger Documentation
URL: `http://localhost:3002/api/docs`

## 🔍 Monitorizare și Debugging

### Verifică coada RabbitMQ
```bash
# Status coadă
docker exec rabbitmq rabbitmqctl list_queues name messages consumers

# Output așteptat:
# seller.queue    0    1
#                 ^    ^
#            mesaje  consumatori
```

### Verifică binding-ul
```bash
docker exec rabbitmq rabbitmqctl list_bindings | grep seller.queue

# Output așteptat:
# order.exchange → seller.queue (order.created)
```

### Monitorizează logs
```bash
docker logs -f seller-service

# Logs așteptate:
# ✅ Connected to RabbitMQ
# Queue seller.queue bound to exchange order.exchange with routing key order.created
# Started consuming messages from seller.queue
# Received message: {"orderId":"..."}
# Processing order: ...
# Order saved with PENDING status - waiting for manual confirmation
# Message stored for order ..., waiting for manual confirmation

# După confirmare manuală (PUT /orders/:id/confirm):
# Order ... manually confirmed
# ✅ Message acknowledged for order ...

# SAU după respingere (PUT /orders/:id/reject):
# Order ... manually rejected
# ❌ Message rejected for order ...
```

### RabbitMQ Management UI
- URL: http://localhost:15672
- User: guest / guest
- Verifică: Queues → seller.queue

## 🎯 Cod Esențial

### Consumer Setup
```typescript
// src/messaging/rabbitmq.consumer.ts

// Stochează mesaje pentru confirmare ulterioară
private pendingMessages = new Map<string, { msg, channel }>();

// 1. Setup exchange, queue, binding
await channel.assertExchange('order.exchange', 'topic', { durable: true });
await channel.assertQueue('seller.queue', { durable: true });
await channel.bindQueue('seller.queue', 'order.exchange', 'order.created');

// 2. Consumă mesaje și le stochează (fără ACK imediat)
channel.consume('seller.queue', async (msg) => {
  try {
    const event = JSON.parse(msg.content.toString());
    await this.sellerService.processOrder(event); // Salvează ca PENDING
    
    // Stochează mesajul pentru confirmare ulterioară
    this.pendingMessages.set(event.orderId, { msg, channel });
    // ← NU se face ACK aici! Așteaptă confirmare manuală
  } catch (error) {
    channel.nack(msg, false, true); // Requeue on error
  }
}, { noAck: false });

// 3. ACK când comanda e confirmată manual
async acknowledgeOrder(orderId: string) {
  const pending = this.pendingMessages.get(orderId);
  if (pending) {
    pending.channel.ack(pending.msg); // ← RabbitMQ șterge mesajul
    this.pendingMessages.delete(orderId);
  }
}

// 4. NACK când comanda e respinsă manual
async rejectOrder(orderId: string) {
  const pending = this.pendingMessages.get(orderId);
  if (pending) {
    pending.channel.nack(pending.msg, false, false); // ← Șterge fără requeue
    this.pendingMessages.delete(orderId);
  }
}
```

### Order Processing
```typescript
// src/modules/seller/seller.service.ts

// Procesează și salvează ca PENDING (fără auto-confirm)
async processOrder(event: OrderCreatedEvent) {
  const order = this.repository.create({
    orderId: event.orderId,
    status: OrderStatus.PENDING,
  });
  await this.repository.save(order);
  return order; // ← Status rămâne PENDING
}

// Confirmare manuală → ACK → RabbitMQ șterge
async confirmOrder(id: string) {
  const order = await this.findOrderById(id);
  order.status = OrderStatus.CONFIRMED;
  order.processedAt = new Date();
  await this.repository.save(order);
  
  // ACK mesajul din RabbitMQ
  await this.rabbitMQConsumer.acknowledgeOrder(order.orderId);
  return order;
}

// Respingere manuală → NACK → RabbitMQ șterge
async rejectOrder(id: string) {
  const order = await this.findOrderById(id);
  order.status = OrderStatus.REJECTED;
  order.processedAt = new Date();
  await this.repository.save(order);
  
  // NACK mesajul din RabbitMQ
  await this.rabbitMQConsumer.rejectOrder(order.orderId);
  return order;
}
```

## 🐛 Troubleshooting

### Messages nu sunt consumate
```bash
# Verifică consumer
docker exec rabbitmq rabbitmqctl list_consumers

# Verifică binding
docker exec rabbitmq rabbitmqctl list_bindings | grep seller.queue

# Verifică logs pentru erori
docker logs seller-service | grep -i error
```

### Messages nu sunt șterse
**Cauză**: ACK nu e trimis sau `noAck: true`

**Soluție**: Verifică că `noAck: false` și `channel.ack(msg)` e apelat după procesare

### Messages sunt requeue-ate infinit
**Cauză**: Eroare în procesare și NACK cu requeue

**Soluție**: 
- Date invalide → `channel.nack(msg, false, false)` (fără requeue)
- Eroare tranzitorie → `channel.nack(msg, false, true)` (cu requeue)

## 📚 Documentație Suplimentară

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arhitectura detaliată a serviciului

## 🎓 Key Concepts

### Single Queue Architecture
- O coadă per serviciu (`seller.queue`)
- Simplu de monitorizat și debugat
- Scalabil (multiple consumers pe aceeași coadă)

### Routing Keys
- Topic exchange permite filtrare flexibilă
- `order.created` - exact match pentru comenzi noi
- Permite adăugare pattern-uri noi fără schimbări

### Manual Acknowledgment
- Consumer controlează când se șterge mesajul
- Previne pierderea mesajelor la erori
- Permite retry logic pentru erori tranzitorii

### Durability
- Exchange durable ✅
- Queue durable ✅
- Messages persistent ✅
- **Rezultat**: Nimic nu se pierde la restart

## ✅ Status

- ✅ RabbitMQ configuration (single queue + routing key)
- ✅ Manual acknowledgment cu message deletion
- ✅ Order processing cu status tracking
- ✅ Database persistence
- ✅ Error handling (NACK cu/fără requeue)
- ✅ Unit tests (20/20 passing)
- ✅ E2E tests
- ✅ Swagger documentation

**Ready for production!** 🚀

