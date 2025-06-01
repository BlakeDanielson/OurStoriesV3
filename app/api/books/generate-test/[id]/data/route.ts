import { NextRequest, NextResponse } from 'next/server'
import { getTestBook, getAllTestBooks } from '@/lib/test-storage'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookId = params.id

    // Debug: Log what we're looking for and what's available
    const allBooks = getAllTestBooks()
    console.log('🔍 Looking for book ID:', bookId)
    console.log(
      '📚 Available books:',
      allBooks.map(book => ({ id: book.id, status: book.status }))
    )

    // Get book from shared storage
    const book = getTestBook(bookId)

    if (!book) {
      console.log('❌ Book not found in storage')
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    console.log('✅ Book found:', {
      id: book.id,
      status: book.status,
      hasPages: !!book.book_pages,
    })

    // Return the complete book data including pages
    return NextResponse.json(book)
  } catch (error) {
    console.error('Failed to fetch book data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
