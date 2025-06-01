// File-based storage for test book generation
// This persists across serverless function invocations

import fs from 'fs'
import path from 'path'

const STORAGE_DIR = path.join(process.cwd(), '.test-storage')
const BOOKS_FILE = path.join(STORAGE_DIR, 'books.json')

// Ensure storage directory exists
function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true })
  }
}

// Load all books from file
function loadBooks(): Record<string, any> {
  try {
    ensureStorageDir()
    if (fs.existsSync(BOOKS_FILE)) {
      const data = fs.readFileSync(BOOKS_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading books:', error)
  }
  return {}
}

// Save all books to file
function saveBooks(books: Record<string, any>) {
  try {
    ensureStorageDir()
    fs.writeFileSync(BOOKS_FILE, JSON.stringify(books, null, 2))
  } catch (error) {
    console.error('Error saving books:', error)
  }
}

export function setTestBook(bookId: string, book: any) {
  const books = loadBooks()
  books[bookId] = book
  saveBooks(books)
}

export function getTestBook(bookId: string) {
  const books = loadBooks()
  return books[bookId] || null
}

export function updateTestBook(bookId: string, updates: any) {
  const books = loadBooks()
  const book = books[bookId]
  if (book) {
    const updatedBook = { ...book, ...updates }
    books[bookId] = updatedBook
    saveBooks(books)
    return updatedBook
  }
  return null
}

export function deleteTestBook(bookId: string) {
  const books = loadBooks()
  const existed = bookId in books
  delete books[bookId]
  saveBooks(books)
  return existed
}

export function getAllTestBooks() {
  const books = loadBooks()
  return Object.values(books)
}

export function clearAllTestBooks() {
  saveBooks({})
}
