"use client"

import * as React from "react"
import { VariantProps, cva } from "class-variance-authority"
import {
  HTMLMotionProps,
  MotionValue,
  motion,
  useMotionTemplate,
  useScroll,
  useTransform,
} from "motion/react"
import { cn } from "@/lib/utils"
import { Star } from "lucide-react"

const cardVariants = cva("absolute will-change-transform", {
  variants: {
    variant: {
      dark: "flex size-full flex-col items-center justify-center gap-6 rounded-2xl border border-border/50 bg-card/90 p-6 backdrop-blur-md",
      light: "flex size-full flex-col items-center justify-center gap-6 rounded-2xl border border-border/30 bg-card/95 p-6 backdrop-blur-md shadow-medium",
    },
  },
  defaultVariants: {
    variant: "light",
  },
})

interface ReviewProps extends React.HTMLAttributes<HTMLDivElement> {
  rating: number
  maxRating?: number
}

interface CardStickyProps
  extends HTMLMotionProps<"div">,
    VariantProps<typeof cardVariants> {
  arrayLength: number
  index: number
  incrementY?: number
  incrementZ?: number
  incrementRotation?: number
}

interface ContainerScrollContextValue {
  scrollYProgress: MotionValue<number>
}

const ContainerScrollContext = React.createContext<
  ContainerScrollContextValue | undefined
>(undefined)

function useContainerScrollContext() {
  const context = React.useContext(ContainerScrollContext)
  if (context === undefined) {
    throw new Error(
      "useContainerScrollContext must be used within a ContainerScrollContextProvider"
    )
  }
  return context
}

export const ContainerScroll: React.FC<
  React.HTMLAttributes<HTMLDivElement>
> = ({ children, style, className, ...props }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start center", "end end"],
  })

  return (
    <ContainerScrollContext.Provider value={{ scrollYProgress }}>
      <div
        ref={scrollRef}
        className={cn("relative", className)}
        style={style}
        {...props}
      >
        {children}
      </div>
    </ContainerScrollContext.Provider>
  )
}
ContainerScroll.displayName = "ContainerScroll"

export const CardsContainer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      className={cn(
        "sticky top-1/2 -translate-y-1/2 flex items-center justify-center",
        className
      )}
      style={{ perspective: "1000px" }}
      {...props}
    >
      {children}
    </div>
  )
}
CardsContainer.displayName = "CardsContainer"

export const CardTransformed = React.forwardRef<HTMLDivElement, CardStickyProps>(
  (
    {
      arrayLength,
      index,
      incrementY = 10,
      incrementZ = 10,
      incrementRotation = -index + 90,
      className,
      variant,
      style,
      ...props
    },
    ref
  ) => {
    const { scrollYProgress } = useContainerScrollContext()

    const start = index / (arrayLength + 1)
    const end = (index + 1) / (arrayLength + 1)
    const range = React.useMemo(() => [start, end], [start, end])
    const rotateRange = [range[0] - 1.5, range[1] / 1.5]

    const y = useTransform(scrollYProgress, range, ["0%", "-180%"])
    const rotate = useTransform(scrollYProgress, rotateRange, [
      incrementRotation,
      0,
    ])
    const transform = useMotionTemplate`translateZ(${
      index * incrementZ
    }px) translateY(${y}) rotate(${rotate}deg)`

    const dx = useTransform(scrollYProgress, rotateRange, [4, 0])
    const dy = useTransform(scrollYProgress, rotateRange, [4, 12])
    const blur = useTransform(scrollYProgress, rotateRange, [2, 24])
    const alpha = useTransform(scrollYProgress, rotateRange, [0.15, 0.2])
    const filter = useMotionTemplate`drop-shadow(${dx}px ${dy}px ${blur}px rgba(0,0,0,${alpha}))`

    const cardStyle = {
      top: index * incrementY,
      transform,
      backfaceVisibility: "hidden" as const,
      zIndex: (arrayLength - index) * incrementZ,
      filter: variant === "light" ? filter : "none",
      ...style,
    }

    return (
      <motion.div
        ref={ref}
        className={cn(cardVariants({ variant }), className)}
        style={cardStyle}
        {...props}
      />
    )
  }
)
CardTransformed.displayName = "CardTransformed"

export const ReviewStars = React.forwardRef<HTMLDivElement, ReviewProps>(
  ({ rating, maxRating = 5, className, ...props }, ref) => {
    const filledStars = Math.floor(rating)
    const fractionalPart = rating - filledStars
    const emptyStars = maxRating - filledStars - (fractionalPart > 0 ? 1 : 0)

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        <div className="flex items-center gap-0.5">
          {[...Array(filledStars)].map((_, index) => (
            <Star
              key={`filled-${index}`}
              className="w-5 h-5 fill-primary text-primary"
            />
          ))}
          {fractionalPart > 0 && (
            <div className="relative">
              <Star className="w-5 h-5 text-muted-foreground/30" />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fractionalPart * 100}%` }}
              >
                <Star className="w-5 h-5 fill-primary text-primary" />
              </div>
            </div>
          )}
          {[...Array(emptyStars)].map((_, index) => (
            <Star
              key={`empty-${index}`}
              className="w-5 h-5 text-muted-foreground/30"
            />
          ))}
        </div>
        <span className="text-sm font-semibold text-foreground">{rating}</span>
      </div>
    )
  }
)
ReviewStars.displayName = "ReviewStars"
