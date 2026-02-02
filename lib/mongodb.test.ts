import mongoose from "mongoose";
import connectDB from "./mongodb";

// Mock mongoose
jest.mock("mongoose", () => ({
  connect: jest.fn(),
}));

describe("connectDB", () => {
  const mockMongooseInstance = {} as typeof mongoose;
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
    process.env.MONGODB_URI = "mongodb://localhost:27017/test";

    // Clear all mocks
    jest.clearAllMocks();

    // Reset global cache
    if (global.mongooseCache) {
      global.mongooseCache.conn = null;
      global.mongooseCache.promise = null;
    }

    // Mock console methods
    jest.spyOn(console, "log").mockImplementation();
    jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    
    // Restore console methods
    jest.restoreAllMocks();
  });

  describe("global.mongooseCache usage", () => {
    it("should correctly use global.mongooseCache for caching connections", async () => {
      // Mock successful connection
      (mongoose.connect as jest.Mock).mockResolvedValueOnce(mockMongooseInstance);

      // Verify global cache is initialized
      expect(global.mongooseCache).toBeDefined();
      expect(global.mongooseCache?.conn).toBeNull();
      expect(global.mongooseCache?.promise).toBeNull();

      // Connect to database
      await connectDB();

      // Verify global cache is populated
      expect(global.mongooseCache?.conn).toBe(mockMongooseInstance);
      expect(global.mongooseCache?.promise).toBeDefined();
    });

    it("should initialize global.mongooseCache if it doesn't exist", async () => {
      // Remove global cache
      delete (global as Record<string, unknown>).mongooseCache;

      // Mock successful connection
      (mongoose.connect as jest.Mock).mockResolvedValueOnce(mockMongooseInstance);

      // Dynamically import to trigger initialization
      jest.resetModules();
      await import("./mongodb");

      // Verify global cache is created
      expect(global.mongooseCache).toBeDefined();
      expect(global.mongooseCache?.conn).toBeNull();
      expect(global.mongooseCache?.promise).toBeNull();
    });
  });

  describe("connection caching", () => {
    it("should return the same cached connection on subsequent calls", async () => {
      // Mock successful connection
      (mongoose.connect as jest.Mock).mockResolvedValueOnce(mockMongooseInstance);

      // First call - establishes connection
      const firstConnection = await connectDB();

      // Verify mongoose.connect was called once
      expect(mongoose.connect).toHaveBeenCalledTimes(1);
      expect(mongoose.connect).toHaveBeenCalledWith(
        "mongodb://localhost:27017/test",
        { bufferCommands: false }
      );

      // Second call - should use cached connection
      const secondConnection = await connectDB();

      // Third call - should still use cached connection
      const thirdConnection = await connectDB();

      // Verify mongoose.connect was NOT called again
      expect(mongoose.connect).toHaveBeenCalledTimes(1);

      // Verify all connections are the same instance
      expect(firstConnection).toBe(secondConnection);
      expect(secondConnection).toBe(thirdConnection);
      expect(firstConnection).toBe(mockMongooseInstance);
    });

    it("should use cached connection if conn is already set in global.mongooseCache", async () => {
      // Pre-populate the cache
      global.mongooseCache = {
        conn: mockMongooseInstance,
        promise: Promise.resolve(mockMongooseInstance),
      };

      // Call connectDB
      const connection = await connectDB();

      // Verify mongoose.connect was NOT called
      expect(mongoose.connect).not.toHaveBeenCalled();

      // Verify the cached connection was returned
      expect(connection).toBe(mockMongooseInstance);
    });
  });

  describe("initial connection", () => {
    it("should establish a new database connection on initial call", async () => {
      // Mock successful connection
      (mongoose.connect as jest.Mock).mockResolvedValueOnce(mockMongooseInstance);

      // Verify cache is empty before connection
      expect(global.mongooseCache?.conn).toBeNull();
      expect(global.mongooseCache?.promise).toBeNull();

      // Connect to database
      const connection = await connectDB();

      // Verify mongoose.connect was called with correct parameters
      expect(mongoose.connect).toHaveBeenCalledTimes(1);
      expect(mongoose.connect).toHaveBeenCalledWith(
        "mongodb://localhost:27017/test",
        { bufferCommands: false }
      );

      // Verify connection was established and cached
      expect(connection).toBe(mockMongooseInstance);
      expect(global.mongooseCache?.conn).toBe(mockMongooseInstance);
      expect(console.log).toHaveBeenCalledWith("✅ MongoDB connected successfully");
    });

    it("should handle connection errors and reset promise", async () => {
      const connectionError = new Error("Connection failed");

      // Mock failed connection
      (mongoose.connect as jest.Mock).mockRejectedValueOnce(connectionError);

      // Attempt to connect
      await expect(connectDB()).rejects.toThrow("Connection failed");

      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        "❌ MongoDB connection error:",
        connectionError
      );

      // Verify promise was reset but conn remains null
      expect(global.mongooseCache?.promise).toBeNull();
      expect(global.mongooseCache?.conn).toBeNull();

      // Verify subsequent calls can retry
      (mongoose.connect as jest.Mock).mockResolvedValueOnce(mockMongooseInstance);
      const connection = await connectDB();

      // Verify retry was successful
      expect(mongoose.connect).toHaveBeenCalledTimes(2);
      expect(connection).toBe(mockMongooseInstance);
    });
  });

  describe("concurrent connections", () => {
    it("should handle multiple concurrent calls without creating multiple connections", async () => {
      let resolveConnection: (value: typeof mongoose) => void;
      const connectionPromise = new Promise<typeof mongoose>((resolve) => {
        resolveConnection = resolve;
      });

      // Mock connection that we control
      (mongoose.connect as jest.Mock).mockReturnValueOnce(connectionPromise);

      // Make multiple concurrent calls
      const call1 = connectDB();
      const call2 = connectDB();
      const call3 = connectDB();

      // Verify only one connection attempt was made
      expect(mongoose.connect).toHaveBeenCalledTimes(1);

      // Resolve the connection
      resolveConnection!(mockMongooseInstance);

      // Wait for all calls to complete
      const [conn1, conn2, conn3] = await Promise.all([call1, call2, call3]);

      // Verify all calls received the same connection
      expect(conn1).toBe(mockMongooseInstance);
      expect(conn2).toBe(mockMongooseInstance);
      expect(conn3).toBe(mockMongooseInstance);

      // Verify still only one connection was made
      expect(mongoose.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe("environment validation", () => {
    it("should throw error if MONGODB_URI is not defined", async () => {
      // Remove MONGODB_URI
      delete process.env.MONGODB_URI;

      // Reset modules to trigger the environment check
      jest.resetModules();

      // Attempt to import should throw
      await expect(import("./mongodb")).rejects.toThrow(
        "Please define the MONGODB_URI environment variable inside .env.local"
      );
    });
  });
});
