#!/bin/bash

for i in {1..2}
do
  # 각 config 파일을 백그라운드에서 실행
  npx artillery run load-test/configs/${i}.yml &
done

# 모든 프로세스가 종료될 때까지 기다림
wait

echo "모든 Artillery 프로세스가 완료되었습니다."
