export interface RabbitMQConfig {
  url: string;
  exchange: string;
  queue: string;
  routingKey: string;
}

const mqPath = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;

const url = mqPath.length > 10 ? mqPath : 'amqp://guest:guest@localhost:5672';

export const getRabbitMQConfig = (): RabbitMQConfig => ({
  url,
  exchange: process.env.RABBITMQ_EXCHANGE || 'order.exchange',
  queue: process.env.RABBITMQ_QUEUE || 'seller.queue',
  routingKey: process.env.RABBITMQ_QUEUE_ROUTING_KEY || 'order.created',
});

