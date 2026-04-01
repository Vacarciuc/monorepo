export interface RabbitMQConfig {
  url: string;
  exchange: string;
  queue: string;
  /** Routing key pentru consumare mesaje de la order-service (e.g. order.created.*) */
  consumerRoutingKey: string;
  /** Routing key pentru publicare confirmare napoi la order-service (e.g. order.processed) */
  producerRoutingKey: string;
}

const url = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;

export const getRabbitMQConfig = (): RabbitMQConfig => ({
  url,
  exchange: process.env.RABBITMQ_EXCHANGE ?? 'order.exchange',
  // Suportă atât RABBITMQ_CONSUMER_QUEUE (compose.dev.ion.yml) cât și RABBITMQ_QUEUE (legacy)
  queue:
    process.env.RABBITMQ_CONSUMER_QUEUE ??
    process.env.RABBITMQ_QUEUE ??
    'seller.queue',
  consumerRoutingKey:
    process.env.RABBITMQ_CONSUMER_ROUTING_KEY ?? 'order.created.*',
  producerRoutingKey:
    process.env.RABBITMQ_PRODUCER_ROUTING_KEY ?? 'order.processed',
});


