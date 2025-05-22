import { spawn } from 'child_process'
import { config } from 'dotenv'

config()

const services = [
  {
    name: 'Next.js',
    command: 'npm',
    args: ['run', 'dev'],
    env: { PORT: process.env.NEXT_PUBLIC_PORT || '3000' }
  },
  {
    name: 'Twilio Server',
    command: 'npm',
    args: ['run', 'server'],
    env: { PORT: process.env.TWILIO_SERVER_PORT || '3002' }
  },
  {
    name: 'Ngrok Tunnel',
    command: 'npm',
    args: ['run', 'tunnel'],
    env: { PORT: process.env.NGROK_PORT || '3002' }
  }
]

console.log('Starting all services...\n')

const processes = services.map(service => {
  const proc = spawn(service.command, service.args, {
    stdio: 'inherit',
    env: { ...process.env, ...service.env }
  })

  proc.on('error', (error) => {
    console.error(`${service.name} error:`, error)
  })

  proc.on('exit', (code) => {
    if (code !== 0) {
      console.log(`${service.name} process exited with code ${code}`)
    }
  })

  return proc
})

console.log('All services started! Press Ctrl+C to stop all services.\n')

process.on('SIGINT', () => {
  console.log('\nStopping all services...')
  processes.forEach(proc => proc.kill())
  process.exit(0)
}) 