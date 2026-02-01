import * as React from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/ui/animated-container"
import { Quote, Star } from "lucide-react"
import { cn } from "@/lib/utils"

const TESTIMONIALS = [
  {
    id: "testimonial-1",
    name: "Priya Sharma",
    profession: "Cloud Kitchen Owner",
    rating: 5,
    description:
      "This platform transformed how we manage our multi-brand kitchen. Orders flow seamlessly and we've reduced errors by 80%!",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "testimonial-2",
    name: "Rahul Mehta",
    profession: "Restaurant Chain Manager",
    rating: 5,
    description:
      "The AI forecasting feature alone saved us thousands in wasted inventory. Incredible tool for modern food businesses.",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "testimonial-3",
    name: "Sarah Chen",
    profession: "Head Chef",
    rating: 5,
    description:
      "Finally, a platform that understands kitchen operations. The workflow automation lets us focus on what matters - the food!",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  },
  {
    id: "testimonial-4",
    name: "David Park",
    profession: "Delivery Manager",
    rating: 5,
    description:
      "Real-time delivery tracking has improved our customer satisfaction scores dramatically. Our drivers love the route optimization.",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
  },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(rating)].map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
      ))}
    </div>
  )
}

export function TestimonialsSection() {
  return (
    <section className="py-20 px-6 relative overflow-hidden bg-secondary/30">
      <div className="absolute inset-0 gradient-mesh opacity-50" />
      
      <div className="container mx-auto relative z-10">
        <FadeIn>
          <div className="text-center mb-14">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-4 block">
              Testimonials
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Loved by Kitchen Owners
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              See what our customers say about transforming their operations.
            </p>
          </div>
        </FadeIn>

        <FadeInStagger className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto" staggerDelay={0.1}>
          {TESTIMONIALS.map((testimonial, index) => (
            <FadeInStaggerItem key={testimonial.id}>
              <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                  "group relative p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-strong transition-all duration-300",
                  index === 0 && "md:col-span-1"
                )}
              >
                {/* Quote icon */}
                <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10 group-hover:text-primary/20 transition-colors" />
                
                {/* Rating */}
                <StarRating rating={testimonial.rating} />
                
                {/* Content */}
                <p className="mt-4 text-foreground leading-relaxed">
                  "{testimonial.description}"
                </p>
                
                {/* Author */}
                <div className="flex items-center gap-3 mt-5 pt-5 border-t border-border/50">
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarImage src={testimonial.avatarUrl} alt={testimonial.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {testimonial.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.profession}</p>
                  </div>
                </div>
              </motion.div>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </div>
    </section>
  )
}
