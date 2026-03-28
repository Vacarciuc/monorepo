export interface RabbitMQConfig {
  url: string;
  exchange: string;
  queue: string;
  routingKey: string;
}

const url = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;

export const getRabbitMQConfig = (): RabbitMQConfig => ({
  url,
  exchange: process.env.RABBITMQ_EXCHANGE!,
  queue: process.env.RABBITMQ_QUEUE!,
  routingKey: process.env.RABBITMQ_QUEUE_ROUTING_KEY!,
});
