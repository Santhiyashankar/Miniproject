import { NextRequest, NextResponse } from 'next/server'
import { aiEvaluator } from '@/lib/ai-evaluator'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

   
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { test_id, video_url, test_type } = await request.json()

    if (!test_id || !video_url || !test_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log(`🚀 Starting advanced AI analysis for ${test_type} test ${test_id}`)

   
    const { data: test, error: testError } = await supabase
      .from('fitness_tests')
      .select('student_id')
      .eq('id', test_id)
      .single()

    if (testError || !test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    if (test.student_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

  
    await supabase
      .from('fitness_tests')
      .update({
        ai_suggestions: 'Advanced AI analysis in progress...',
        analyzed_at: null
      })
      .eq('id', test_id)


    const analysis = await aiEvaluator.analyzeTest(video_url, test_type)

    console.log(`✅ AI analysis completed. Score: ${analysis.score}/100`)


    const { error: updateError } = await supabase
      .from('fitness_tests')
      .update({
        score: analysis.score,
        ai_suggestions: analysis.suggestions.join('. ') + ` (AI Confidence: ${Math.round(analysis.confidence * 100)}%)`,
        metrics: analysis.metrics,
        analyzed_at: new Date().toISOString()
      })
      .eq('id', test_id)

    if (updateError) {
      console.error('Error updating test record:', updateError)
      return NextResponse.json({ error: 'Failed to update test record' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      analysis: {
        ...analysis,
        confidence: Math.round(analysis.confidence * 100)
      },
      test_id
    })

  } catch (error: any) {
    console.error('AI analysis error:', error)
    return NextResponse.json({ 
      error: 'Analysis failed: ' + error.message 
    }, { status: 500 })
  }
}