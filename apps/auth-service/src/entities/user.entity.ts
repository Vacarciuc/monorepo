import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { UserRole } from '@/auth/user-role'


@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int' })
  id: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @Column({
    name: 'role',
    enumName: 'user_role',
    enum: UserRole,
    type: 'enum',
    default: 'user',
  })
  role: UserRole

  @Column({ name: 'email', length: 255, unique: true })
  @Index()
  email: string

  @Column({ name: 'username', length: 255, nullable: true })
  @Index()
  username: string

  @Column({ name: 'password', length: 255, nullable: true })
  password: string
}
