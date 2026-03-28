import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm'

export enum OutboxEventType {
  ORDER_CREATED = 'ORDER_CREATED',
}

@Entity('outbox_events')
export class OutboxEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column({ type: 'varchar' })
  type: OutboxEventType

  @Column({ type: 'varchar' })
  routing_key: string

  @Column({ type: 'jsonb' })
  payload: Record<string, any>

  @Index()
  @Column({ type: 'timestamptz', nullable: true })
  published_at: Date | null

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date
}
