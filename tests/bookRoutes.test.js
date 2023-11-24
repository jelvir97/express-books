const request = require("supertest");
process.env.NODE_ENV = 'test'

const app = require("../app");
const db = require("../db");
const book = require("../models/book");
const e = require("express");

const testValues = [1234567890, 'amazon.com', "AuthorTest",
                    "EnglishTest",100,"PublisherTest","TitleTest",2000]

beforeEach(async()=>{
    await db.query('DELETE FROM books')
    await db.query(`INSERT INTO books
                    (isbn,amazon_url,author,language,pages,publisher,title,year)
                    VALUES
                    ($1,$2,$3,$4,$5,$6,$7,$8)`,testValues)
})

describe('GET /books/ route', ()=>{
    
    test('should return list of all books', async()=>{
        const res = await request(app).get('/books/')
        expect(res.statusCode).toEqual(200)
        expect(res.body.books.length).toBe(1)
    })
})

describe('POST /books/ route',()=>{

    test('should create book and return book as json object', async()=>{
        const res = await request(app)
                            .post('/books/')
                            .send({isbn:'111111111',
                                    amazon_url:'amazon.com',
                                    author: "AuthorTest2",
                                    language:'EnglishTest2',
                                    pages:100,
                                    publisher: 'PublisherTest2',
                                    title:'TitleTest2',
                                    year:2000
                                })

        expect(res.statusCode).toEqual(201)
        expect(res.body.book.title).toEqual('TitleTest2')
        expect(res.body.book.author).toEqual('AuthorTest2')
    })

    test('should fail due to missing title', async()=>{
        const res = await request(app)
                    .post('/books/')
                    .send({isbn:'111111111',
                            amazon_url:'amazon.com',
                            author: "AuthorTest2",
                            language:'EnglishTest2',
                            pages:100,
                            publisher: 'PublisherTest2',
                            year:2000
                        })
        expect(res.body.error.message).toContain('instance requires property "title"')
        expect(res.body.error.message.length).toEqual(1)
        expect(res.statusCode).toEqual(400)
    })
    
    test('should fail do to invalid type for pages',async ()=>{
        const res = await request(app)
                    .post('/books/')
                    .send({isbn:'111111111',
                            amazon_url:'amazon.com',
                            author: "AuthorTest2",
                            language:'EnglishTest2',
                            pages:'100',
                            publisher: 'PublisherTest2',
                            title: 'TitleTest2',
                            year:2000
                        })
        expect(res.body.error.message).toContain('instance.pages is not of a type(s) integer')
        expect(res.body.error.message.length).toEqual(1)
        expect(res.statusCode).toEqual(400)                
    })

    test('should fail with multiple errors', async ()=>{
        const res = await request(app)
                    .post('/books/')
                    .send({isbn:'111111111',
                            amazon_url:'amazon.com',
                            author: "AuthorTest2",
                            language:'EnglishTest2',
                            pages:'100',
                            publisher: 'PublisherTest2',
                            year:1400
                        })
        expect(res.statusCode).toEqual(400)
        expect(res.body.error.message.length).toEqual(3)                       
        expect(res.body.error.message).toEqual(['instance requires property "title"','instance.pages is not of a type(s) integer','instance.year must be greater than or equal to 1600'])          
    })
})

describe('GET /books/:id route', ()=>{
    test('should return book with isbn 1234567890', async ()=>{
        const res = await request(app).get('/books/1234567890')
        expect(res.statusCode).toEqual(200)
        expect(res.body.book.title).toEqual('TitleTest')
        expect(res.body.book.pages).toEqual(100)
    })
    
    test('should fail as 404 Not Found',async ()=>{
        const res = await request(app).get('/books/1')
        expect(res.statusCode).toEqual(404)
        expect(res.body.error.message).toEqual("There is no book with an isbn '1")
    })
})

describe('PUT /books/:isbn',()=>{
    test('should update book title to TestTestTest',async ()=>{
        const res = await request(app)
                            .put('/books/1234567890')
                            .send({
                                    amazon_url:'amazon.com',
                                    author: "AuthorTest",
                                    language:'EnglishTest',
                                    pages:100,
                                    publisher: 'PublisherTest',
                                    title:'TestTestTest',
                                    year:2000
                                })

        expect(res.statusCode).toEqual(200)
        expect(res.body.book.title).toEqual('TestTestTest')
    })

    test('should update book with multiple changes',async ()=>{
        const res = await request(app)
                            .put('/books/1234567890')
                            .send({
                                    amazon_url:'test.com',
                                    author: "AuthorTest",
                                    language:'EnglishTest',
                                    pages:101,
                                    publisher: 'PublisherTest',
                                    title:'TestTestTest',
                                    year:2000
                                })
        
        expect(res.statusCode).toEqual(200)
        expect(res.body.book.title).toEqual('TestTestTest')
        expect(res.body.book.pages).toEqual(101)
        expect(res.body.book.amazon_url).toEqual('test.com')
    })

    test('should fail with 404 not found', async ()=>{
        const res = await request(app)
                            .put('/books/1')
                            .send({
                                    amazon_url:'amazon.com',
                                    author: "AuthorTest2",
                                    language:'EnglishTest2',
                                    pages:100,
                                    publisher: 'PublisherTest2',
                                    title:'TitleTest2',
                                    year:2000
                                })
        expect(res.statusCode).toEqual(404)    
    })

    test('should fail due to missing info', async()=>{
        const res = await request(app)
                            .put('/books/1234567890')
                            .send({
                                    amazon_url:'amazon.com',
                                    language:'EnglishTest2',
                                    pages:100,
                                    publisher: 'PublisherTest2',
                                    title:'TitleTest2',
                                    year:2000
                                })

        expect(res.statusCode).toEqual(400)
        expect(res.body.error.message.length).toEqual(1)
        expect(res.body.error.message).toContain('instance requires property "author"')
    })

    test('should fail with multiple error messages',async()=>{
        const res = await request(app)
                            .put('/books/1234567890')
                            .send({
                                    pages:'100',
                                    publisher: 'PublisherTest2',
                                    title:'TitleTest2',
                                    year:2000
                                })
        expect(res.statusCode).toEqual(400)
        expect(res.body.error.message.length).toEqual(4)
        expect(res.body.error.message).toEqual([
                                                'instance requires property "amazon_url"',
                                                'instance requires property "author"',
                                                'instance requires property "language"',
                                                'instance.pages is not of a type(s) integer'
                                            ])
    })
})

describe('DELETE /books/:isbn route',()=>{
    
    test('should delete book and return success message', async()=>{
        const res = await request(app).delete('/books/1234567890')
        
        expect(res.statusCode).toEqual(200)
        expect(res.body.message).toEqual('Book deleted')
    })

    test('should fail with 404', async()=>{
        const res = await request(app).delete('/123')

        expect(res.statusCode).toEqual(404)
        expect(res.body.error.message).toBe('Not Found')
    })
})

afterAll(async ()=>{
    await db.end()
})