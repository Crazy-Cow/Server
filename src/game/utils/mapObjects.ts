import * as fs from 'fs'
import * as path from 'path'

export interface RawBoundingBox {
    min: [number, number, number]
    max: [number, number, number]
}

export interface RawMapObject {
    name: string
    boundingBox: RawBoundingBox
}

export interface BoundingBox {
    min: { x: number; y: number; z: number }
    max: { x: number; y: number; z: number }
}

export interface MapObject {
    name: string
    boundingBox: BoundingBox
}

// 파일 경로 설정
const mapObjectsFilePath = path.join(__dirname, '../data/mapObjects.json')

// 파일 읽기 및 파싱
const mapObjectsData = fs.readFileSync(mapObjectsFilePath, 'utf-8')
const mapObjects = JSON.parse(mapObjectsData)

// 필요한 오브젝트 필터링 및 스케일링
const relevantObjects = mapObjects.filter((obj: RawMapObject) => {
    return (
        obj.name.includes('house') ||
        obj.name.includes('tree') ||
        obj.name.includes('pPlane')
    )
})

const scaledObjects: MapObject[] = relevantObjects.map((obj: RawMapObject) => {
    const scaleFactor = 0.1 // 1/10 스케일링

    const scaledMin = obj.boundingBox.min.map(
        (coord: number) => coord * scaleFactor
    )
    const scaledMax = obj.boundingBox.max.map(
        (coord: number) => coord * scaleFactor
    )

    return {
        name: obj.name,
        boundingBox: {
            min: { x: scaledMin[0], y: scaledMin[1], z: scaledMin[2] },
            max: { x: scaledMax[0], y: scaledMax[1], z: scaledMax[2] },
        },
    }
})

export default scaledObjects
