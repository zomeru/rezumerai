import type { PrismaClient } from "@rezumerai/database";
import type { CreateUserInput, User } from "./model";

/**
 * User service — business logic only, no HTTP concerns.
 *
 * NOTE: Currently uses in-memory mock data matching the original Express
 * server. Replace with real Prisma queries when the User model is added
 * to the schema.
 */

const mockUsers: User[] = [
  { id: "1", name: "John Doe", email: "john@example.com" },
  { id: "2", name: "Jane Smith", email: "jane@example.com" },
];

export class UserService {
  constructor(readonly db: PrismaClient) {}

  async findAll(): Promise<User[]> {
    // TODO: return this.db.user.findMany();
    return mockUsers;
  }

  async findById(id: string): Promise<User | null> {
    // TODO: return this.db.user.findUnique({ where: { id } });
    return mockUsers.find((u): u is User => u.id === id) ?? null;
  }

  async create(input: CreateUserInput): Promise<User> {
    // TODO: return this.db.user.create({ data: input });
    const newUser: User = {
      id: (mockUsers.length + 1).toString(),
      name: input.name,
      email: input.email,
    };
    mockUsers.push(newUser);
    return newUser;
  }
}
