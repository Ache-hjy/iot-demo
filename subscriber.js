const mqtt = require('mqtt')
const client = mqtt.connect('mqtt://broker-cn.emqx.io:1883')

client.on('connect', () => {
  console.log('✅ 订阅端连接MQTT成功')
  client.subscribe('iot/demo/data')
})

client.on('message', (topic, payload) => {
  console.log('📥 收到消息：', payload.toString())
})
client.on('error', (err)=>{
  console.error('❌ 连接失败：', err.message)
})
