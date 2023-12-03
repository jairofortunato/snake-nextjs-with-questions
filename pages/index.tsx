import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import useInterval from '@use-it/interval'

import { HeadComponent as Head } from 'components/Head'

type Apple = {
  x: number
  y: number
}

type Velocity = {
  dx: number
  dy: number
}

export default function SnakeGame() {
  // Canvas Settings
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const canvasWidth = 500
  const canvasHeight = 380
  const canvasGridSize = 20

  // Game Settings
  const minGameSpeed = 10
  const maxGameSpeed = 15

  // Game State
  const [gameDelay, setGameDelay] = useState<number>(1000 / minGameSpeed)
  const [countDown, setCountDown] = useState<number>(4)
  const [running, setRunning] = useState(false)
  const [isLost, setIsLost] = useState(false)
  const [highscore, setHighscore] = useState(0)
  const [newHighscore, setNewHighscore] = useState(false)
  const [score, setScore] = useState(0)
  const [snake, setSnake] = useState<{
    head: { x: number; y: number }
    trail: Array<any>
  }>({
    head: { x: 12, y: 9 },
    trail: [],
  })
  const [apple, setApple] = useState<Apple>({ x: -1, y: -1 })
  const [velocity, setVelocity] = useState<Velocity>({ dx: 0, dy: 0 })
  const [previousVelocity, setPreviousVelocity] = useState<Velocity>({
    dx: 0,
    dy: 0,
  })

  const clearCanvas = (ctx: CanvasRenderingContext2D) =>
    ctx.clearRect(-1, -1, canvasWidth + 2, canvasHeight + 2)

  const generateApplePosition = (): Apple => {
    const x = Math.floor(Math.random() * (canvasWidth / canvasGridSize))
    const y = Math.floor(Math.random() * (canvasHeight / canvasGridSize))
    // Check if random position interferes with snake head or trail
    if (
      (snake.head.x === x && snake.head.y === y) ||
      snake.trail.some((snakePart) => snakePart.x === x && snakePart.y === y)
    ) {
      return generateApplePosition()
    }
    return { x, y }
  }

  // Initialise state and start countdown
  const startGame = () => {
    setGameDelay(1000 / minGameSpeed)
    setIsLost(false)
    setScore(0)
    setSnake({
      head: { x: 12, y: 9 },
      trail: [],
    })
    setApple(generateApplePosition())
    setVelocity({ dx: 0, dy: -1 })
    setRunning(true)
    setNewHighscore(false)
    setCountDown(3)
  }

  // Reset state and check for highscore
  const gameOver = () => {
    if (score > highscore) {
      setHighscore(score)
      localStorage.setItem('highscore', score.toString())
      setNewHighscore(true)
    }
    setIsLost(true)
    setRunning(false)
    setVelocity({ dx: 0, dy: 0 })
    setCountDown(4)
  }

  const fillRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    ctx.fillRect(x, y, w, h)
  }

  const strokeRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    ctx.strokeRect(x + 0.5, y + 0.5, w, h)
  }

  const drawSnake = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#0170F3'
    ctx.strokeStyle = '#003779'

    fillRect(
      ctx,
      snake.head.x * canvasGridSize,
      snake.head.y * canvasGridSize,
      canvasGridSize,
      canvasGridSize
    )

    strokeRect(
      ctx,
      snake.head.x * canvasGridSize,
      snake.head.y * canvasGridSize,
      canvasGridSize,
      canvasGridSize
    )

    snake.trail.forEach((snakePart) => {
      fillRect(
        ctx,
        snakePart.x * canvasGridSize,
        snakePart.y * canvasGridSize,
        canvasGridSize,
        canvasGridSize
      )

      strokeRect(
        ctx,
        snakePart.x * canvasGridSize,
        snakePart.y * canvasGridSize,
        canvasGridSize,
        canvasGridSize
      )
    })
  }

  const drawApple = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#DC3030' // '#38C172' // '#F4CA64'
    ctx.strokeStyle = '#881A1B' // '#187741' // '#8C6D1F

    if (
      apple &&
      typeof apple.x !== 'undefined' &&
      typeof apple.y !== 'undefined'
    ) {
      fillRect(
        ctx,
        apple.x * canvasGridSize,
        apple.y * canvasGridSize,
        canvasGridSize,
        canvasGridSize
      )

      strokeRect(
        ctx,
        apple.x * canvasGridSize,
        apple.y * canvasGridSize,
        canvasGridSize,
        canvasGridSize
      )
    }
  }

  const [questionAsked, setQuestionAsked] = useState(false)

  // Update snake.head, snake.trail and apple positions. Check for collisions.
  const updateSnake = () => {
    if (!running || showQuestion) {
      return
    }

    // Check for collision with walls
    const nextHeadPosition = {
      x: snake.head.x + velocity.dx,
      y: snake.head.y + velocity.dy,
    }
    if (
      nextHeadPosition.x < 0 ||
      nextHeadPosition.y < 0 ||
      nextHeadPosition.x >= canvasWidth / canvasGridSize ||
      nextHeadPosition.y >= canvasHeight / canvasGridSize
    ) {
      gameOver()
      return // Exit the function immediately
    }

    // Check for collision with apple
    if (nextHeadPosition.x === apple.x && nextHeadPosition.y === apple.y) {
      setScore((prevScore) => prevScore + 1)
      setApple(generateApplePosition())
    }

    const updatedSnakeTrail = [...snake.trail, { ...snake.head }]
    // Remove trail history beyond snake trail length (score + 2)
    while (updatedSnakeTrail.length > score + 2) updatedSnakeTrail.shift()
    // Check for snake colliding with itself
    if (
      updatedSnakeTrail.some(
        (snakePart) =>
          snakePart.x === nextHeadPosition.x &&
          snakePart.y === nextHeadPosition.y
      )
    ) {
      gameOver()
      return // Exit the function immediately
    }

    // Update state
    setPreviousVelocity({ ...velocity })
    setSnake({
      head: { ...nextHeadPosition },
      trail: [...updatedSnakeTrail],
    })

    // Check if the player's score is a multiple of 5 to show the question
    if (score % 3 === 0 && score !== 0 && !questionAsked) {
      generateQuestion()
      setRunning(false) // Pause the game
      setQuestionAsked(true)
    } else if (score % 3 !== 0 && questionAsked) {
      setQuestionAsked(false)
    }
  }

  // Game Hook
  useEffect(() => {
    const canvas = canvasRef?.current
    const ctx = canvas?.getContext('2d')

    if (ctx && !isLost) {
      clearCanvas(ctx)
      drawApple(ctx)
      drawSnake(ctx)
    }
  }, [snake])

  // Game Update Interval
  useInterval(
    () => {
      if (!isLost) {
        updateSnake()
      }
    },
    running && countDown === 0 ? gameDelay : null
  )

  // Countdown Interval
  useInterval(
    () => {
      setCountDown((prevCountDown) => prevCountDown - 1)
    },
    countDown > 0 && countDown < 4 ? 800 : null
  )

  // DidMount Hook for Highscore
  useEffect(() => {
    setHighscore(
      localStorage.getItem('highscore')
        ? parseInt(localStorage.getItem('highscore')!)
        : 0
    )
  }, [])

  // Score Hook: increase game speed starting at 16
  useEffect(() => {
    if (score > minGameSpeed && score <= maxGameSpeed) {
      setGameDelay(1000 / score)
    }
  }, [score])

  // Event Listener: Key Presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        [
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'w',
          'a',
          's',
          'd',
        ].includes(e.key)
      ) {
        let velocity = { dx: 0, dy: 0 }

        switch (e.key) {
          case 'ArrowRight':
            velocity = { dx: 1, dy: 0 }
            break
          case 'ArrowLeft':
            velocity = { dx: -1, dy: 0 }
            break
          case 'ArrowDown':
            velocity = { dx: 0, dy: 1 }
            break
          case 'ArrowUp':
            velocity = { dx: 0, dy: -1 }
            break
          case 'd':
            velocity = { dx: 1, dy: 0 }
            break
          case 'a':
            velocity = { dx: -1, dy: 0 }
            break
          case 's':
            velocity = { dx: 0, dy: 1 }
            break
          case 'w':
            velocity = { dx: 0, dy: -1 }
            break
          default:
            console.error('Error with handleKeyDown')
        }
        if (
          !(
            previousVelocity.dx + velocity.dx === 0 &&
            previousVelocity.dy + velocity.dy === 0
          )
        ) {
          setVelocity(velocity)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [previousVelocity])

  const [showQuestion, setShowQuestion] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [options, setOptions] = useState<string[]>([])

  const generateQuestion = () => {
    const questionsAndAnswers = [
      {
        question: 'What is 2 + 2?',
        options: ['4', '5', '6', '7'],
        correctAnswer: '4',
      },
      // Add more questions, options, and correct answers as needed
    ]

    const randomIndex = Math.floor(Math.random() * questionsAndAnswers.length)
    const selectedQuestion = questionsAndAnswers[randomIndex]
    setQuestion(selectedQuestion.question)
    setOptions(selectedQuestion.options)
    setAnswer(selectedQuestion.correctAnswer) // Set the correct answer
    setShowQuestion(true)
  }

  const checkAnswer = (selectedOption: string) => {
    if (selectedOption === answer) {
      // Check if the selected option is the correct answer
      // Correct answer
      setShowQuestion(false)
      setRunning(true) // Resume the game
    } else {
      // Incorrect answer, end the game
      gameOver()
    }
  }

  const handleInteraction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const canvasCenterX = canvasWidth / 2
    const canvasCenterY = canvasHeight / 2

    if (Math.abs(x - canvasCenterX) > Math.abs(y - canvasCenterY)) {
      // Horizontal interaction
      if (x < canvasCenterX) {
        // Left interaction
        setVelocity({ dx: -1, dy: 0 })
      } else {
        // Right interaction
        setVelocity({ dx: 1, dy: 0 })
      }
    } else {
      // Vertical interaction
      if (y < canvasCenterY) {
        // Up interaction
        setVelocity({ dx: 0, dy: -1 })
      } else {
        // Down interaction
        setVelocity({ dx: 0, dy: 1 })
      }
    }
  }
  const handleTouch = (e: TouchEvent) => {
    e.preventDefault()
    const touchX = e.touches[0].clientX
    const touchY = e.touches[0].clientY
    handleInteraction(touchX, touchY)
  }

  const handleClick = (e: MouseEvent) => {
    e.preventDefault()
    handleInteraction(e.clientX, e.clientY)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener('touchstart', handleTouch)
      canvas.addEventListener('mousedown', handleClick)
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('touchstart', handleTouch)
        canvas.removeEventListener('mousedown', handleClick)
      }
    }
  }, [])

  function drawArrows(ctx: CanvasRenderingContext2D) {
    const arrowSize = 30 // Size of the arrows
    const padding = 10 // Space from the edge of the canvas

    ctx.fillStyle = 'black' // Arrow color

    // Draw Up Arrow
    ctx.beginPath()
    ctx.moveTo(canvasWidth / 2, padding)
    ctx.lineTo(canvasWidth / 2 - arrowSize / 2, padding + arrowSize)
    ctx.lineTo(canvasWidth / 2 + arrowSize / 2, padding + arrowSize)
    ctx.fill()

    // Draw Down Arrow
    ctx.beginPath()
    ctx.moveTo(canvasWidth / 2, canvasHeight - padding)
    ctx.lineTo(
      canvasWidth / 2 - arrowSize / 2,
      canvasHeight - padding - arrowSize
    )
    ctx.lineTo(
      canvasWidth / 2 + arrowSize / 2,
      canvasHeight - padding - arrowSize
    )
    ctx.fill()

    // Draw Left Arrow
    ctx.beginPath()
    ctx.moveTo(padding, canvasHeight / 2)
    ctx.lineTo(padding + arrowSize, canvasHeight / 2 - arrowSize / 2)
    ctx.lineTo(padding + arrowSize, canvasHeight / 2 + arrowSize / 2)
    ctx.fill()

    // Draw Right Arrow
    ctx.beginPath()
    ctx.moveTo(canvasWidth - padding, canvasHeight / 2)
    ctx.lineTo(
      canvasWidth - padding - arrowSize,
      canvasHeight / 2 - arrowSize / 2
    )
    ctx.lineTo(
      canvasWidth - padding - arrowSize,
      canvasHeight / 2 + arrowSize / 2
    )
    ctx.fill()
  }
  useEffect(() => {
    const canvas = canvasRef?.current
    const ctx = canvas?.getContext('2d')

    if (ctx && !isLost) {
      clearCanvas(ctx)
      drawApple(ctx)
      drawSnake(ctx)
      drawArrows(ctx) // Add this line
    }
  }, [snake, apple, isLost])

  return (
    <>
      <Head />
      <main>
        {showQuestion && (
          <div className="question-container">
            <p className="question">{question}</p>
            <div className="options">
              {options.map((option) => (
                <button key={option} onClick={() => checkAnswer(option)}>
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={canvasWidth + 1}
          height={canvasHeight + 1}
        />
        <section>
          <div className="score">
            <p>
              <FontAwesomeIcon icon={['fas', 'star']} />
              Score: {score}
            </p>
            <p>
              <FontAwesomeIcon icon={['fas', 'trophy']} />
              Highscore: {highscore > score ? highscore : score}
            </p>
          </div>
          {!isLost && countDown > 0 ? (
            <button onClick={startGame}>
              {countDown === 4 ? 'Start Game' : countDown}
            </button>
          ) : (
            <div className="controls">
              <p>How to Play?</p>
              <p>
                <FontAwesomeIcon icon={['fas', 'arrow-up']} />
                <FontAwesomeIcon icon={['fas', 'arrow-right']} />
                <FontAwesomeIcon icon={['fas', 'arrow-down']} />
                <FontAwesomeIcon icon={['fas', 'arrow-left']} />
              </p>
            </div>
          )}
        </section>
        {isLost && (
          <div className="game-overlay">
            <p className="large">Game Over</p>
            <p className="final-score">
              {newHighscore ? `🎉 New Highscore 🎉` : `You scored: ${score}`}
            </p>
            {!running && isLost && (
              <button onClick={startGame}>
                {countDown === 4 ? 'Restart Game' : countDown}
              </button>
            )}
          </div>
        )}
      </main>
      <footer>
        Copyright &copy; <a href="https://mueller.dev">Marc Müller</a> 2022
        &nbsp;|&nbsp;{' '}
        <a href="https://github.com/marcmll/next-snake">
          <FontAwesomeIcon icon={['fab', 'github']} /> Github
        </a>
      </footer>
    </>
  )
}
