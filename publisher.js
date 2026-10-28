const mqtt = require('mqtt')
// 换成国内可用地址 broker-cn.emqx.io
const client = mqtt.connect('mqtt://broker-cn.emqx.io:1883')

client.on('connect', () => {
  console.log('✅ 发布端连接MQTT成功')
  setInterval(() => {
    const data = {
      temp: (20 + Math.random()*10).toFixed(2),
      hum: (40 + Math.random()*20).toFixed(2),
      time: new Date().toLocaleString()
    }
    client.publish('iot/demo/data', JSON.stringify(data))
    console.log('📤 已发送：', data)
  }, 2000)
})
// 新增错误监听，连不上会打印原因
client.on('error', (err)=>{
  console.error('❌ 连接失败：', err.message)
})