import { Test, TestingModule } from '@nestjs/testing';
import { SellerUseCases } from './seller.usecase';
import { SellerRepository } from '../../domain/repositories/seller.repository';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Seller, SellerStatus } from '../../domain/entities/seller.entity';

describe('SellerUseCases', () => {
  let useCases: SellerUseCases;
  let repository: jest.Mocked<SellerRepository>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SellerUseCases,
        {
          provide: SellerRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCases = module.get<SellerUseCases>(SellerUseCases);
    repository = module.get(SellerRepository);
  });

  describe('createSeller', () => {
    it('should create a new seller', async () => {
      const dto = {
        name: 'John Doe',
        email: 'john@example.com',
        companyName: 'Acme Inc.',
      };

      const expectedSeller: Seller = {
        id: '123',
        ...dto,
        status: SellerStatus.ACTIVE,
        createdAt: new Date(),
        products: [],
      };

      repository.findByEmail.mockResolvedValue(null);
      repository.create.mockResolvedValue(expectedSeller);

      const result = await useCases.createSeller(dto);

      expect(result).toEqual(expectedSeller);
      expect(repository.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(repository.create).toHaveBeenCalledWith(dto);
    });

    it('should throw ConflictException if email already exists', async () => {
      const dto = {
        name: 'John Doe',
        email: 'john@example.com',
        companyName: 'Acme Inc.',
      };

      const existingSeller: Seller = {
        id: '123',
        ...dto,
        status: SellerStatus.ACTIVE,
        createdAt: new Date(),
        products: [],
      };

      repository.findByEmail.mockResolvedValue(existingSeller);

      await expect(useCases.createSeller(dto)).rejects.toThrow(ConflictException);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('getAllSellers', () => {
    it('should return all sellers', async () => {
      const sellers: Seller[] = [
        {
          id: '1',
          name: 'Seller 1',
          email: 'seller1@example.com',
          companyName: 'Company 1',
          status: SellerStatus.ACTIVE,
          createdAt: new Date(),
          products: [],
        },
        {
          id: '2',
          name: 'Seller 2',
          email: 'seller2@example.com',
          companyName: 'Company 2',
          status: SellerStatus.ACTIVE,
          createdAt: new Date(),
          products: [],
        },
      ];

      repository.findAll.mockResolvedValue(sellers);

      const result = await useCases.getAllSellers();

      expect(result).toEqual(sellers);
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('getSellerById', () => {
    it('should return a seller by id', async () => {
      const seller: Seller = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        companyName: 'Acme Inc.',
        status: SellerStatus.ACTIVE,
        createdAt: new Date(),
        products: [],
      };

      repository.findById.mockResolvedValue(seller);

      const result = await useCases.getSellerById('123');

      expect(result).toEqual(seller);
      expect(repository.findById).toHaveBeenCalledWith('123');
    });

    it('should throw NotFoundException if seller not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(useCases.getSellerById('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSeller', () => {
    it('should update a seller', async () => {
      const sellerId = '123';
      const dto = { name: 'Updated Name' };

      const existingSeller: Seller = {
        id: sellerId,
        name: 'John Doe',
        email: 'john@example.com',
        companyName: 'Acme Inc.',
        status: SellerStatus.ACTIVE,
        createdAt: new Date(),
        products: [],
      };

      const updatedSeller: Seller = {
        ...existingSeller,
        ...dto,
      };

      repository.findById.mockResolvedValue(existingSeller);
      repository.update.mockResolvedValue(updatedSeller);

      const result = await useCases.updateSeller(sellerId, dto);

      expect(result).toEqual(updatedSeller);
      expect(repository.update).toHaveBeenCalledWith(sellerId, dto);
    });

    it('should throw ConflictException if new email already exists', async () => {
      const sellerId = '123';
      const dto = { email: 'existing@example.com' };

      const existingSeller: Seller = {
        id: sellerId,
        name: 'John Doe',
        email: 'john@example.com',
        companyName: 'Acme Inc.',
        status: SellerStatus.ACTIVE,
        createdAt: new Date(),
        products: [],
      };

      const otherSeller: Seller = {
        id: '456',
        name: 'Other Seller',
        email: 'existing@example.com',
        companyName: 'Other Inc.',
        status: SellerStatus.ACTIVE,
        createdAt: new Date(),
        products: [],
      };

      repository.findById.mockResolvedValue(existingSeller);
      repository.findByEmail.mockResolvedValue(otherSeller);

      await expect(useCases.updateSeller(sellerId, dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteSeller', () => {
    it('should delete a seller', async () => {
      const sellerId = '123';

      const existingSeller: Seller = {
        id: sellerId,
        name: 'John Doe',
        email: 'john@example.com',
        companyName: 'Acme Inc.',
        status: SellerStatus.ACTIVE,
        createdAt: new Date(),
        products: [],
      };

      repository.findById.mockResolvedValue(existingSeller);
      repository.delete.mockResolvedValue(undefined);

      await useCases.deleteSeller(sellerId);

      expect(repository.delete).toHaveBeenCalledWith(sellerId);
    });

    it('should throw NotFoundException if seller not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(useCases.deleteSeller('999')).rejects.toThrow(NotFoundException);
    });
  });
});

