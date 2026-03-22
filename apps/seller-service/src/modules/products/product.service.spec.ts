import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../../database/entities/product.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('ProductService', () => {
  let service: ProductService;
  let repository: Repository<Product>;

  const mockProduct = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    imagePath: '/uploads/products/test.png',
    sellerId: '00000000-0000-0000-0000-000000000001',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    repository = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const createDto = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
      };

      mockRepository.create.mockReturnValue(mockProduct);
      mockRepository.save.mockResolvedValue(mockProduct);

      const result = await service.createProduct(createDto, '/uploads/products/test.png');

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        sellerId: '00000000-0000-0000-0000-000000000001',
        imagePath: '/uploads/products/test.png',
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockProduct);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('findAllProducts', () => {
    it('should return an array of products', async () => {
      const products = [mockProduct];
      mockRepository.find.mockResolvedValue(products);

      const result = await service.findAllProducts();

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(products);
    });
  });

  describe('findProductById', () => {
    it('should return a product if found', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findProductById(mockProduct.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: mockProduct.id } });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findProductById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      const updateDto = {
        name: 'Updated Product',
        price: 149.99,
      };

      mockRepository.findOne.mockResolvedValue(mockProduct);
      mockRepository.save.mockResolvedValue({ ...mockProduct, ...updateDto });

      const result = await service.updateProduct(mockProduct.id, updateDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: mockProduct.id } });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.name).toEqual(updateDto.name);
      expect(result.price).toEqual(updateDto.price);
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockProduct);
      mockRepository.remove.mockResolvedValue(mockProduct);

      await service.deleteProduct(mockProduct.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: mockProduct.id } });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteProduct('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

