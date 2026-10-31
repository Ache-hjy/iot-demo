const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const mqtt = require('mqtt')

const PORT = 3000
const BROKER_URL = 'mqtt://broker-cn.emqx.io:1883'
const TOPIC = 'iot/demo/data'
const MAX_BUFFER = 50

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

app.use(express.static('public'))
// 本地托管 ECharts，避免依赖外网 CDN
app.use('/echarts', express.static(require('path').join(__dirname, 'node_modules', 'echarts', 'dist')))

// 数据缓冲区：保留最近 MAX_BUFFER 条记录
const buffer = []

// 连接 MQTT Broker 并订阅主题
const mqttClient = mqtt.connect(BROKER_URL)

mqttClient.on('connect', () => {
  console.log('[MQTT] 已连接到', BROKER_URL)
  mqttClient.subscribe(TOPIC, (err) => {
    if (err) {
      console.error('[MQTT] 订阅失败：', err.message)
    } else {
      console.log('[MQTT] 已订阅主题：', TOPIC)
    }
  })
})

mqttClient.on('message', (topic, payload) => {
  try {
    const raw = JSON.parse(payload.toString())
    const data = {
      time: raw.time || new Date().toLocaleString(),
      temp: parseFloat(raw.temp),
      hum: parseFloat(raw.hum)
    }
    if (Number.isNaN(data.temp) || Number.isNaN(data.hum)) {
      console.warn('[MQTT] 数据格式异常，已忽略：', payload.toString())
      return
    }
    buffer.push(data)
    if (buffer.length > MAX_BUFFER) buffer.shift()
    // 广播给所有在线客户端
    io.emit('sensor', data)
  } catch (e) {
    console.error('[MQTT] 消息解析失败：', e.message)
  }
})

mqttClient.on('error', (err) => {
  console.error('[MQTT] 连接错误：', err.message)
})

mqttClient.on('close', () => {
  console.warn('[MQTT] 连接已断开')
})

// Socket.IO：新客户端连接时下发历史数据
io.on('connection', (socket) => {
  console.log('[Socket] 客户端已连接：', socket.id)
  socket.emit('history', buffer)
  socket.on('disconnect', () => {
    console.log('[Socket] 客户端已断开：', socket.id)
  })
})

server.listen(PORT, () => {
  console.log(`[HTTP] 可视化看板已启动：http://localhost:${PORT}`)
})
