import { NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'

import { OrderItem } from '../entities/order-item.entity'
import { Order, OrderStatus } from '../entities/order.entity'
import { RabbitMQService } from '../rabbitmq/rabbitmq.service'
import { SellerClientService } from '../seller/seller-client.service'
import { OrdersService } from './orders.service'

// ── helpers ────────────────────────────────────────────────────────────────────

const makeOrder = (overrides: Partial<Order> = {}): Order =>
  ({
    id: 'order-uuid-1',
    user_id: 'user-uuid-1',
    seller_id: 'seller-uuid-1',
    total_price: 199.99,
    status: OrderStatus.PENDING,
    items: [],
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    ...overrides,
  }) as Order

// ── mocks ──────────────────────────────────────────────────────────────────────

const mockOrderRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
}

const mockOrderItemRepository = {
  create: jest.fn(),
}

const mockDataSource = {
  createQueryRunner: jest.fn(),
}

const mockRabbitMQService = {
  consumeOrderProcessed: jest.fn().mockResolvedValue(undefined),
  publishOrderCreated: jest.fn().mockResolvedValue(undefined),
}

const mockSellerClientService = {
  getProduct: jest.fn(),
}

// ── suite ──────────────────────────────────────────────────────────────────────

describe('OrdersService', () => {
  let service: OrdersService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepository },
        { provide: getRepositoryToken(OrderItem), useValue: mockOrderItemRepository },
        { provide: DataSource, useValue: mockDataSource },
        { provide: RabbitMQService, useValue: mockRabbitMQService },
        { provide: SellerClientService, useValue: mockSellerClientService },
      ],
    }).compile()

    service = module.get<OrdersService>(OrdersService)
    jest.clearAllMocks()
  })

  // ── findAll ──────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returnează lista de comenzi pentru userId-ul dat', async () => {
      const userId = 'user-uuid-1'
      const orders = [
        makeOrder({ id: 'order-1', user_id: userId }),
        makeOrder({ id: 'order-2', user_id: userId, status: OrderStatus.CONFIRMED }),
      ]
      mockOrderRepository.find.mockResolvedValue(orders)

      const result = await service.findAll(userId)

      expect(mockOrderRepository.find).toHaveBeenCalledWith({
        where: { user_id: userId },
        relations: ['items'],
        order: { created_at: 'DESC' },
      })
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('order-1')
      expect(result[1].status).toBe(OrderStatus.CONFIRMED)
    })
  })

  // ── findOne ───────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('aruncă NotFoundException când comanda nu este găsită', async () => {
      mockOrderRepository.findOne.mockResolvedValue(null)

      await expect(
        service.findOne('non-existent-id', 'user-uuid-1'),
      ).rejects.toThrow(NotFoundException)

      expect(mockOrderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-id', user_id: 'user-uuid-1' },
        relations: ['items'],
      })
    })

    it('returnează comanda când este găsită', async () => {
      const order = makeOrder()
      mockOrderRepository.findOne.mockResolvedValue(order)

      const result = await service.findOne(order.id, order.user_id)

      expect(result).toEqual(order)
    })
  })
})

