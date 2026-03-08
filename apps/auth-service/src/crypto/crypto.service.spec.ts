import { Test, TestingModule } from '@nestjs/testing'
import bcrypt from 'bcrypt'
import crypto from 'crypto'

import { CryptoService } from './crypto.service'

// Mock the external libraries
jest.mock('bcrypt')
jest.mock('crypto')

describe('CryptoService', () => {
  let service: CryptoService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CryptoService],
    }).compile()

    service = module.get<CryptoService>(CryptoService)
    jest.clearAllMocks()
  })

  describe('generateToken', () => {
    it('should generate a random hex string of the default length', () => {
      const mockBytes = Buffer.from('mockbytes')
      // Mock the chained calls: randomBytes(len).toString(enc)
      ;(crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: jest.fn().mockReturnValue('mockedhex'),
      })

      const result = service.generateToken()

      expect(result).toBe('mockedhex')
      expect(crypto.randomBytes).toHaveBeenCalledWith(16)
    })

    it('should use the provided length and encoding', () => {
      const mockToString = jest.fn().mockReturnValue('bW9ja2VkYmFzZTY0')
      ;(crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: mockToString,
      })

      const result = service.generateToken(32, 'base64')

      expect(result).toBe('bW9ja2VkYmFzZTY0')
      expect(crypto.randomBytes).toHaveBeenCalledWith(32)
      expect(mockToString).toHaveBeenCalledWith('base64')
    })
  })

  describe('hash', () => {
    it('should call bcrypt.hash with correct salt rounds', async () => {
      const password = 'plainPassword'
      const expectedHash = 'hashedPassword123'
      ;(bcrypt.hash as jest.Mock).mockResolvedValue(expectedHash)

      const result = await service.hash(password)

      expect(result).toBe(expectedHash)
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12) // Verify SALT_ROUNDS
    })
  })

  describe('hashCompare', () => {
    it('should return true if bcrypt.compare returns true', async () => {
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const result = await service.hashCompare('password', 'hash')

      expect(result).toBe(true)
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hash')
    })

    it('should return false if bcrypt.compare returns false', async () => {
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const result = await service.hashCompare('wrongPassword', 'hash')

      expect(result).toBe(false)
    })
  })
})
