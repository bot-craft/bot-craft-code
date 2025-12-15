from pymongo import MongoClient
from config import MONGO_URI, DB_NAME

print(MONGO_URI)

# MongoDB Connection
client = MongoClient(MONGO_URI)
db = client[DB_NAME]