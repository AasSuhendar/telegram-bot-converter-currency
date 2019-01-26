const { Composer, log, session, Markup, WizardScene, Stage } = require('micro-bot')
const { enter } = Stage
const bot = new Composer()
const Converter = require('./currency-converter')

bot.use(log())

// Log response
bot.use((ctx, next) => {
  const start = new Date()
  return next(ctx).then(() => {
    const ms = new Date() - start
    console.log('Response time %sms', ms)
  })
})

// Start Bot
bot.start(ctx => {
  ctx.reply(
    `How can I help you, ${ctx.from.first_name}?`,
    Markup.inlineKeyboard([
      Markup.callbackButton('💱 Convert Currency', 'CONVERT_CURRENCY')
    ]).extra()
  )
})

// Stop current action
bot.command('stop', ctx => {
  ctx.reply(
    `Ok boss! Bye`
  )
  return currencyConverter.leave()
})

// Get about bot
bot.command('about', ctx => {
  ctx.reply(
    `Did you know I was created by this tutorial?
Check out how I was made 👇😀
https://chatbotslife.com/build-a-simple-telegram-currency-converter-bot-with-node-js-84d15b10597c`
  )
  return currencyConverter.leave()
})

// Go back to menu after action
bot.action('BACK', ctx => {
  ctx.reply(
    `Do you need something else, ${ctx.from.first_name}?`,
    Markup.inlineKeyboard([
      Markup.callbackButton('💱 Convert Currency', 'CONVERT_CURRENCY')
    ]).extra()
  )
})

// Currency converter Wizard
const currencyConverter = new WizardScene(
  'currency_converter',
  ctx => {
    ctx.reply('Please, type in the currency to convert from (example: USD)')
    return ctx.wizard.next()
  },
  ctx => {
    /*
        * ctx.wizard.state is the state management object which is persistent
        * throughout the wizard
        * we pass to it the previous user reply (supposed to be the source Currency)
        * which is retrieved through `ctx.message.text`
        */
    ctx.wizard.state.currencySource = ctx.message.text
    ctx.reply(`Got it, you wish to convert from ${ctx.wizard.state.currencySource} to what currency? (example: EUR)`
    )
    // Go to the following scene
    return ctx.wizard.next()
  },
  ctx => {
    /*
        * we get currency to convert to from the last user's input
        * which is retrieved through `ctx.message.text`
        */
    ctx.wizard.state.currencyDestination = ctx.message.text
    ctx.reply(`Enter the amount to convert from ${ctx.wizard.state.currencySource} to ${ctx.wizard.state.currencyDestination}`
    )
    return ctx.wizard.next()
  },
  ctx => {
    ctx.reply(
      `Okay let's see this...`
    )
    const amount = (ctx.wizard.state.amount = ctx.message.text)
    const source = ctx.wizard.state.currencySource
    const dest = ctx.wizard.state.currencyDestination
    const rates = Converter.getRate(source, dest)
    rates.then(res => {
      let newAmount = Object.values(res.data)[0] * amount
      newAmount = newAmount.toFixed(3).toString()
      if (newAmount === 'NaN') {
        ctx.reply(
          `Hmmm... weird, I can't convert this, check through your currency inputs`,
          Markup.inlineKeyboard([
            Markup.callbackButton('🔙 Back to Menu', 'BACK'),
            Markup.callbackButton('💱 Convert Again', 'CONVERT_CURRENCY')
          ]).extra())
      } else {
        ctx.reply(`${amount} ${source} is worth \n${newAmount} ${dest}`,
          Markup.inlineKeyboard([
            Markup.callbackButton('🔙 Back to Menu', 'BACK'),
            Markup.callbackButton('💱 Convert Another Currency', 'CONVERT_CURRENCY')
          ]).extra())
      }
    })
    return ctx.scene.leave()
  }
)

// Scene registration
const stage = new Stage([currencyConverter], { ttl: 300 })
bot.use(session())
bot.use(stage.middleware())

// Stop current action
bot.command('convert', enter('currency_converter'))
bot.action('CONVERT_CURRENCY', enter('currency_converter'))

// Matching any input and default known inputs
bot.hears('Hello', ({ reply }) => reply('Hello! What\'s up?'))
bot.hears('Hi', ({ reply }) => reply('Hi! What\'s up?'))

bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.command('date', ({ reply }) => reply(`Server time: ${Date()}`))

bot.hears(/.*/, ({ match, reply }) => reply(`I really wish i could understand what "${match}" means
As for now you can use /convert to make me convert currencies this is my skill 😁`))

// start bot with command this
// bot.launch()
// bot.startPolling()

module.exports = bot
