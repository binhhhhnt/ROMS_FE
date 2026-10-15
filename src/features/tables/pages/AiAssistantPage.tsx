import { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  Mic,
  MicOff,
  Send,
  Users,
  DollarSign,
  AlertOctagon,
  Bot,
  User,
  RotateCcw,
  PlusCircle,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Flame,
} from 'lucide-react'
import { toast } from 'sonner'

import { aiApi, type AiRecommendationItem } from '@/features/tables/api/aiApi'
import { useAuthStore } from '@/app/store/authStore'
import { useCartStore } from '@/features/ordering/store/cartStore'
import { getApiErrorMessage } from '@/shared/lib/axios'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Badge } from '@/shared/components/ui/badge'

interface ChatMessage {
  id: string
  sender: 'user' | 'bot'
  text: string
  timestamp: Date
  recommendations?: AiRecommendationItem[]
}

const QUICK_PROMPTS = [
  'Gợi ý combo món ngon cho 4 người ăn gia đình 👨‍👩‍👧‍👦',
  'Tìm các món thanh đạm, ít dầu mỡ và không cay 🥗',
  'Món nhậu hấp dẫn cùng bạn bè 🍻',
  'Bữa ăn ấm cúng dưới 500.000đ cho 2 người 💸',
  'Các món hải sản đặc sắc tươi ngon nhất 🦞',
  'Đồ uống thanh mát và món tráng miệng ngọt dịu 🍹',
]

export function AiAssistantPage() {
  const { user } = useAuthStore()
  const { addItem } = useCartStore()
  const isTablet = user?.role === 'TABLE_ACCOUNT'

  // Advanced criteria states
  const [showFilters, setShowFilters] = useState(false)
  const [partySize, setPartySize] = useState<number | ''>(4)
  const [allergies, setAllergies] = useState('')
  const [budgetRange, setBudgetRange] = useState('')

  // Chat message input & history
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Messages stream
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'bot',
      text: 'Xin chào quý khách! Tôi là Trợ lý Ẩm thực AI thông minh của nhà hàng ROMS. Hãy trò chuyện với tôi về khẩu vị, sở thích món ăn, số lượng người hoặc bất kỳ yêu cầu nào (dị ứng, ngân sách...), tôi sẽ gợi ý thực đơn chuẩn xác và đang sẵn sàng phục vụ quý khách!',
      timestamp: new Date(),
    },
  ])

  // Scroll to bottom on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Initialize SpeechRecognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.lang = 'vi-VN'
      recognition.interimResults = false

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript))
        setIsListening(false)
        toast.success(`Đã nhận giọng nói: "${transcript}"`)
      }

      recognition.onerror = () => {
        setIsListening(false)
        toast.error('Không thể nhận diện giọng nói. Quý khách vui lòng thử lại hoặc gõ phím.')
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói tiếng Việt.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
        toast.info('Đang lắng nghe... Quý khách hãy nói yêu cầu món ăn (tiếng Việt)')
      } catch {
        setIsListening(false)
      }
    }
  }

  // Handle sending a message
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim()
    if (!query || isLoading) return

    // 1. Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    // 2. Call backend AI recommendation API
    try {
      const res = await aiApi.getRecommendations({
        message: query,
        preferences: query,
        partySize: partySize ? Number(partySize) : undefined,
        allergies: allergies.trim() || undefined,
        budgetRange: budgetRange.trim() || undefined,
      })

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: res.message || 'Dưới đây là các món ăn được lựa chọn riêng theo khẩu vị của quý khách:',
        timestamp: new Date(),
        recommendations: res.recommendations || [],
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (err) {
      const errorMsg = getApiErrorMessage(err) || 'Không thể kết nối với Trợ lý AI lúc này.'
      const errorBotMessage: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: `Rất tiếc: ${errorMsg}. Quý khách vui lòng thử lại hoặc chọn một câu hỏi gợi ý bên dưới.`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorBotMessage])
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // Reset conversation
  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: 'Cuộc trò chuyện mới đã bắt đầu! Quý khách muốn tìm kiếm món ăn nào hôm nay?',
        timestamp: new Date(),
      },
    ])
    setInputText('')
    toast.info('Đã làm mới cuộc trò chuyện với Trợ lý AI')
  }

  // Add to cart helper
  const handleAddToCart = (item: AiRecommendationItem) => {
    addItem({
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.price,
    })
    toast.success(`Đã thêm "${item.name}" vào giỏ hàng!`)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] max-w-5xl mx-auto bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-primary to-primary-hover px-6 py-4 text-white flex items-center justify-between border-b border-primary/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-accent/20 border border-white/30 flex items-center justify-center text-accent shadow-sm">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-primary rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight">Trợ lý Ẩm thực ROMS AI</h1>
              <Badge variant="cooking" className="bg-white/20 text-white text-[11px] hover:bg-white/30">
                Gemini 2.5 Flash
              </Badge>
            </div>
            <p className="text-xs text-white/80">
              Gợi ý món ăn chuẩn vị • Kiểm tra nguyên liệu tồn kho theo thời gian thực
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle filter criteria */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white text-xs h-8"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
            Tiêu chí
            {showFilters ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
          </Button>

          {/* Reset chat button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetChat}
            className="text-white hover:bg-white/10 hover:text-white text-xs h-8"
            title="Bắt đầu hội thoại mới"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Collapsible Filter Bar */}
      {showFilters && (
        <div className="bg-surface/50 border-b border-border p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs shrink-0 animate-in slide-in-from-top-2 duration-200">
          <div>
            <label className="font-semibold text-text flex items-center gap-1.5 mb-1">
              <Users className="w-3.5 h-3.5 text-primary" />
              Số lượng người ăn
            </label>
            <Input
              type="number"
              min={1}
              max={50}
              value={partySize}
              onChange={(e) => setPartySize(e.target.value ? Number(e.target.value) : '')}
              placeholder="Ví dụ: 4 người"
              className="h-8 bg-card text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-text flex items-center gap-1.5 mb-1">
              <AlertOctagon className="w-3.5 h-3.5 text-amber-500" />
              Dị ứng / Kiêng kỵ
            </label>
            <Input
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="Ví dụ: Dị ứng tôm, kiêng ăn cay..."
              className="h-8 bg-card text-xs"
            />
          </div>

          <div>
            <label className="font-semibold text-text flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-green-500" />
              Ngân sách dự kiến
            </label>
            <Input
              value={budgetRange}
              onChange={(e) => setBudgetRange(e.target.value)}
              placeholder="Ví dụ: Khoảng 500.000đ - 1.000.000đ"
              className="h-8 bg-card text-xs"
            />
          </div>
        </div>
      )}

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-background/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-4xl ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-primary/10 text-primary border border-primary/20'
              }`}
            >
              {msg.sender === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-5 h-5 text-primary" />
              )}
            </div>

            {/* Bubble Content */}
            <div className={`space-y-3 max-w-[85%] sm:max-w-[78%]`}>
              <div
                className={`p-4 rounded-2xl shadow-xs text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-primary text-white rounded-tr-xs'
                    : 'bg-card border border-border text-text rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>
                <div
                  className={`text-[10px] mt-1.5 text-right ${
                    msg.sender === 'user' ? 'text-white/70' : 'text-muted'
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              {/* Recommendations Cards (If any in Bot Message) */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wide">
                    <Sparkles className="w-3.5 h-3.5" />
                    Thực đơn đề xuất phù hợp ({msg.recommendations.length} món)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {msg.recommendations.map((item) => (
                      <div
                        key={item.menuItemId}
                        className="bg-card border border-border/80 hover:border-primary/50 transition-all rounded-xl p-3.5 shadow-xs flex flex-col justify-between group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-semibold text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full inline-block mb-1">
                                {item.categoryName}
                              </span>
                              <h3 className="font-bold text-text text-sm group-hover:text-primary transition-colors">
                                {item.name}
                              </h3>
                            </div>
                            <span className="font-bold text-primary text-sm shrink-0">
                              {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              }).format(item.price)}
                            </span>
                          </div>

                          {item.description && (
                            <p className="text-xs text-muted line-clamp-2">
                              {item.description}
                            </p>
                          )}

                          {item.reason && (
                            <div className="bg-primary/5 border border-primary/15 rounded-lg p-2 text-xs text-text/90 italic flex items-start gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>{item.reason}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-border/60 mt-3 flex items-center justify-between">
                          <Badge variant="ready" className="text-[10px] py-0 px-2">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Đang sẵn sàng
                          </Badge>

                          {isTablet && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddToCart(item)}
                              className="h-7 text-xs border-primary/30 text-primary hover:bg-primary hover:text-white"
                            >
                              <PlusCircle className="w-3.5 h-3.5 mr-1" />
                              Thêm vào giỏ
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-4xl mr-auto">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 animate-pulse text-primary" />
            </div>
            <div className="bg-card border border-border p-4 rounded-2xl rounded-tl-xs shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-xs text-primary font-medium">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                AI đang rà soát thực đơn & kiểm tra tồn kho nguyên liệu...
              </div>
              <div className="flex items-center gap-1.5 py-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
              </div>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Quick Prompts Carousel */}
      <div className="bg-surface/30 px-4 py-2 border-t border-border flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[11px] font-semibold text-muted flex items-center gap-1 shrink-0">
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          Gợi ý nhanh:
        </span>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="text-xs bg-card hover:bg-primary/10 border border-border hover:border-primary/40 text-text px-3 py-1.5 rounded-full whitespace-nowrap transition-colors shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 sm:p-4 bg-card border-t border-border shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex items-center gap-2"
        >
          {/* Voice Input Button */}
          <Button
            type="button"
            variant={isListening ? 'destructive' : 'outline'}
            size="icon"
            onClick={toggleListening}
            className={`rounded-full shrink-0 transition-all ${
              isListening ? 'animate-pulse ring-2 ring-red-400' : ''
            }`}
            title={isListening ? 'Đang lắng nghe... bấm để dừng' : 'Nói tiếng Việt'}
          >
            {isListening ? (
              <MicOff className="w-4 h-4 text-white" />
            ) : (
              <Mic className="w-4 h-4 text-primary" />
            )}
          </Button>

          {/* Text Input Field */}
          <div className="relative flex-1">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isListening
                  ? 'Đang lắng nghe giọng nói của bạn...'
                  : 'Hỏi Trợ lý AI (ví dụ: tư vấn combo lẩu cho 4 người không cay...)'
              }
              disabled={isLoading}
              className="pr-10 h-11 bg-surface/50 border-border focus-visible:ring-primary text-sm rounded-full px-4"
            />
          </div>

          {/* Send Button */}
          <Button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="rounded-full h-11 px-5 bg-primary hover:bg-primary-hover text-white shadow-xs shrink-0"
          >
            <Send className="w-4 h-4 mr-1.5" />
            Gửi
          </Button>
        </form>
      </div>
    </div>
  )
}
export default AiAssistantPage
