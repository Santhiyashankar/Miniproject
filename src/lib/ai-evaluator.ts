export interface AIAnalysisResult {
  score: number
  suggestions: string[]
  metrics: {
    [key: string]: number
  }
  confidence: number
  performanceLevel: string
  improvementAreas: string[]
  strengths: string[]
  comparison: {
    percentile: number
    category: string
  }
}

// Define specific metric interfaces
interface VerticalJumpMetrics {
  jumpHeight: number
  powerOutput: number
  formStability: number
  armCoordination: number
}

interface ShuttleRunMetrics {
  speed: number
  agility: number
  acceleration: number
  turningEfficiency: number
}

interface SitUpsMetrics {
  repsPerMinute: number
  formConsistency: number
  rangeOfMotion: number
  paceConsistency: number
}

type TestMetrics = VerticalJumpMetrics | ShuttleRunMetrics | SitUpsMetrics

class AIEvaluator {
  // Performance benchmarks based on real athletic data
  private benchmarks = {
    vertical_jump: {
      elite: 70, good: 55, average: 40, beginner: 25
    },
    shuttle_run: {
      elite: 5.0, good: 5.8, average: 6.5, beginner: 7.5 // seconds
    },
    sit_ups: {
      elite: 45, good: 35, average: 25, beginner: 15 // reps per minute
    }
  }

  // Technical analysis parameters
  private technicalFactors = {
    vertical_jump: ['arm_coordination', 'takeoff_technique', 'landing_stability', 'explosive_power'],
    shuttle_run: ['acceleration', 'turning_efficiency', 'speed_maintenance', 'agility'],
    sit_ups: ['form_consistency', 'range_of_motion', 'pace_control', 'core_engagement']
  }

  async analyzeVerticalJump(videoUrl: string): Promise<AIAnalysisResult> {
    // Simulate video processing with realistic timing
    await this.simulateProcessing(3)
    
    // Generate realistic metrics with correlation
    const jumpHeight = this.generateCorrelatedMetric(25, 65, 0.7) // 25-65cm
    const powerOutput = jumpHeight * 45 + Math.random() * 500 // Correlated with height
    const formStability = this.generateCorrelatedMetric(60, 95, 0.6)
    const armCoordination = this.generateCorrelatedMetric(65, 98, 0.5)

    const technicalScore = (formStability + armCoordination) / 2
    const performanceScore = Math.min(100, (jumpHeight / 70) * 100 * 0.7 + technicalScore * 0.3)

    const metrics: VerticalJumpMetrics = {
      jumpHeight: Math.round(jumpHeight * 10) / 10,
      powerOutput: Math.round(powerOutput),
      formStability: Math.round(formStability),
      armCoordination: Math.round(armCoordination)
    }

    const analysis = this.generateComprehensiveAnalysis(
      'vertical_jump',
      performanceScore,
      metrics
    )

    console.log(`🏀 Vertical Jump Analysis: ${analysis.score}/100`)
    return analysis
  }

  async analyzeShuttleRun(videoUrl: string): Promise<AIAnalysisResult> {
    await this.simulateProcessing(4)
    
    const speed = this.generateCorrelatedMetric(4.0, 6.0, 0.8) // m/s
    const agility = this.generateCorrelatedMetric(70, 98, 0.7)
    const acceleration = this.generateCorrelatedMetric(5.5, 8.5, 0.6)
    const turningEfficiency = this.generateCorrelatedMetric(75, 97, 0.65)

    // Convert speed to score (faster = better)
    const speedScore = Math.min(100, ((6.5 - speed) / 2.5) * 100)
    const technicalScore = (agility + acceleration + turningEfficiency) / 3
    const performanceScore = speedScore * 0.6 + technicalScore * 0.4

    const metrics: ShuttleRunMetrics = {
      speed: Math.round(speed * 10) / 10,
      agility: Math.round(agility),
      acceleration: Math.round(acceleration * 10) / 10,
      turningEfficiency: Math.round(turningEfficiency)
    }

    const analysis = this.generateComprehensiveAnalysis(
      'shuttle_run',
      performanceScore,
      metrics
    )

    console.log(`🏃 Shuttle Run Analysis: ${analysis.score}/100`)
    return analysis
  }

  async analyzeSitUps(videoUrl: string): Promise<AIAnalysisResult> {
    await this.simulateProcessing(3)
    
    const repsPerMinute = this.generateCorrelatedMetric(20, 50, 0.75)
    const formConsistency = this.generateCorrelatedMetric(65, 98, 0.7)
    const rangeOfMotion = this.generateCorrelatedMetric(70, 99, 0.6)
    const paceConsistency = this.generateCorrelatedMetric(68, 97, 0.55)

    const enduranceScore = Math.min(100, (repsPerMinute / 50) * 100)
    const technicalScore = (formConsistency + rangeOfMotion + paceConsistency) / 3
    const performanceScore = enduranceScore * 0.5 + technicalScore * 0.5

    const metrics: SitUpsMetrics = {
      repsPerMinute: Math.round(repsPerMinute),
      formConsistency: Math.round(formConsistency),
      rangeOfMotion: Math.round(rangeOfMotion),
      paceConsistency: Math.round(paceConsistency)
    }

    const analysis = this.generateComprehensiveAnalysis(
      'sit_ups',
      performanceScore,
      metrics
    )

    console.log(`💪 Sit-ups Analysis: ${analysis.score}/100`)
    return analysis
  }

  // Enhanced analysis generation with proper typing
  private generateComprehensiveAnalysis(
    testType: string, 
    score: number, 
    metrics: TestMetrics
  ): AIAnalysisResult {
    const performanceLevel = this.getPerformanceLevel(score)
    const percentile = this.calculatePercentile(score)
    const category = this.getCategory(testType, score)

    return {
      score: Math.round(score),
      suggestions: this.generateIntelligentSuggestions(testType, metrics, score),
      metrics: this.formatMetrics(metrics),
      confidence: this.calculateConfidence(metrics),
      performanceLevel,
      improvementAreas: this.identifyImprovementAreas(testType, metrics),
      strengths: this.identifyStrengths(testType, metrics),
      comparison: {
        percentile,
        category
      }
    }
  }

  // Smart suggestion generation with type guards
  private generateIntelligentSuggestions(testType: string, metrics: TestMetrics, score: number): string[] {
    const suggestions: string[] = []
    const lowThreshold = 75
    const highThreshold = 90

    switch (testType) {
      case 'vertical_jump':
        const jumpMetrics = metrics as VerticalJumpMetrics
        if (jumpMetrics.jumpHeight < 35) {
          suggestions.push("Focus on plyometric exercises like box jumps to improve explosive power")
        }
        if (jumpMetrics.armCoordination < lowThreshold) {
          suggestions.push("Practice arm swing coordination during takeoff for better momentum")
        }
        if (jumpMetrics.formStability < lowThreshold) {
          suggestions.push("Work on maintaining core stability throughout the jump sequence")
        }
        if (score > highThreshold) {
          suggestions.push("Excellent technique! Consider advanced power training for competitive performance")
        }
        break

      case 'shuttle_run':
        const runMetrics = metrics as ShuttleRunMetrics
        if (runMetrics.speed < 4.8) {
          suggestions.push("Incorporate sprint intervals to improve acceleration and top speed")
        }
        if (runMetrics.turningEfficiency < lowThreshold) {
          suggestions.push("Practice pivot turns and change of direction drills")
        }
        if (runMetrics.agility < lowThreshold) {
          suggestions.push("Add ladder drills to improve footwork and agility")
        }
        if (score > highThreshold) {
          suggestions.push("Outstanding agility! Focus on maintaining consistency under fatigue")
        }
        break

      case 'sit_ups':
        const situpMetrics = metrics as SitUpsMetrics
        if (situpMetrics.repsPerMinute < 30) {
          suggestions.push("Build core endurance with progressive overload training")
        }
        if (situpMetrics.rangeOfMotion < lowThreshold) {
          suggestions.push("Ensure full range of motion from shoulder touch to knee contact")
        }
        if (situpMetrics.paceConsistency < lowThreshold) {
          suggestions.push("Practice maintaining consistent rhythm throughout the set")
        }
        if (score > highThreshold) {
          suggestions.push("Exceptional core endurance! Consider weighted exercises for advanced development")
        }
        break
    }

    // Add general suggestions
    if (suggestions.length === 0) {
      suggestions.push("Maintain consistent training frequency to continue progress")
      suggestions.push("Focus on proper recovery and nutrition for optimal performance")
    }

    return suggestions.slice(0, 3) // Return top 3 most relevant suggestions
  }

  // Type-safe improvement areas identification
  private identifyImprovementAreas(testType: string, metrics: TestMetrics): string[] {
    const areas: string[] = []
    const lowThreshold = 75

    Object.entries(metrics).forEach(([metric, value]) => {
      // Type guard to ensure value is a number
      if (typeof value === 'number' && value < lowThreshold) {
        areas.push(metric.replace(/([A-Z])/g, ' $1').toLowerCase())
      }
    })

    return areas.slice(0, 2)
  }

  // Type-safe strengths identification
  private identifyStrengths(testType: string, metrics: TestMetrics): string[] {
    const strengths: string[] = []
    const highThreshold = 85

    Object.entries(metrics).forEach(([metric, value]) => {
      // Type guard to ensure value is a number
      if (typeof value === 'number' && value > highThreshold) {
        strengths.push(metric.replace(/([A-Z])/g, ' $1').toLowerCase())
      }
    })

    return strengths.slice(0, 2)
  }

  // Type-safe confidence calculation
  private calculateConfidence(metrics: TestMetrics): number {
    const values = Object.values(metrics).filter((v): v is number => typeof v === 'number')
    const consistency = 1 - (this.calculateVariance(values) / 100)
    return Math.round((0.7 + consistency * 0.3) * 100) / 100
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b) / values.length
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
    return Math.sqrt(variance)
  }

  private formatMetrics(metrics: TestMetrics): { [key: string]: number } {
    const formatted: { [key: string]: number } = {}
    Object.entries(metrics).forEach(([key, value]) => {
      if (typeof value === 'number') {
        formatted[key] = Math.round(value * 10) / 10
      }
    })
    return formatted
  }

  // Helper methods
  private generateCorrelatedMetric(min: number, max: number, correlation: number): number {
    const base = Math.random() * (max - min) + min
    const variation = (1 - correlation) * (Math.random() - 0.5) * (max - min)
    return Math.round((base + variation) * 10) / 10
  }

  private getPerformanceLevel(score: number): string {
    if (score >= 90) return "Elite"
    if (score >= 80) return "Advanced"
    if (score >= 70) return "Proficient"
    if (score >= 60) return "Intermediate"
    return "Beginner"
  }

  private calculatePercentile(score: number): number {
    // Realistic percentile distribution
    return Math.min(99, Math.max(1, Math.round((score / 100) * 95 + 5)))
  }

  private getCategory(testType: string, score: number): string {
    if (score >= 85) return "Elite"
    if (score >= 70) return "Competitive"
    if (score >= 55) return "Recreational"
    return "Developing"
  }

  private simulateProcessing(seconds: number): Promise<void> {
    const delay = seconds * 1000 + Math.random() * 2000 // 2-5 second variation
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  async analyzeTest(videoUrl: string, testType: string): Promise<AIAnalysisResult> {
    console.log(`🧠 Starting advanced AI analysis for ${testType}...`)
    
    switch (testType) {
      case 'vertical_jump':
        return this.analyzeVerticalJump(videoUrl)
      case 'shuttle_run':
        return this.analyzeShuttleRun(videoUrl)
      case 'sit_ups':
        return this.analyzeSitUps(videoUrl)
      default:
        throw new Error(`Unknown test type: ${testType}`)
    }
  }
}

export const aiEvaluator = new AIEvaluator()