import swaggerAutogen from 'swagger-autogen'

const HOST = 'localhost:8000' // TODO: 실제 SERVER ENDPOINT로 수정 필요
const doc = {
    info: {
        title: 'API Documentation',
    },
    host: HOST,
}

const outputFile = './swagger-output.json'
const endpointsFiles = ['./src/app.ts', './src/routes/index.ts']

swaggerAutogen()(outputFile, endpointsFiles, doc)
