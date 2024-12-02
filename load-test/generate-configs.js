const fs = require('fs');
const path = require('path');

// config 폴더 경로
const configFolder = path.join(__dirname, 'configs');

// config 폴더가 존재하면 삭제
if (fs.existsSync(configFolder)) {
  fs.rmdirSync(configFolder, { recursive: true });  // 폴더와 그 안의 모든 파일 삭제
  console.log('기존 config 폴더를 삭제했습니다.');
}

// 새로 config 폴더 생성
fs.mkdirSync(configFolder);
console.log('새 config 폴더를 생성했습니다.');

const numberOfConfigs = 2;  // 테스트용 2개의 config 파일 생성

// config 파일 생성
for (let i = 0; i < numberOfConfigs; i++) {
  const clientId = `user-${i + 1}`;

  // config.yml 내용
  const configContent = `
config:
  target: 'http://localhost:8000'
  phases:
    - duration: 10  # 테스트 지속 시간
      arrivalCount: 1  # 각 config에서 1명의 유저
  engines:
    socketio-v3:
      auth:
        clientId: '${clientId}'  # 동적으로 생성된 clientId를 사용

scenarios:
  - name: '유저 입장'
    engine: socketio-v3
    flow:
      - emit:
          channel: 'room.enter'
          data:
            charType: 1
      - think: 9  # 첫 번째 유저 입장 후 대기
  `;

  // config-1.yml, config-2.yml 파일 생성
  fs.writeFileSync(path.join(configFolder, `${i + 1}.yml`), configContent);
  console.log(`Generated config-${i + 1}.yml with clientId ${clientId}`);
}
