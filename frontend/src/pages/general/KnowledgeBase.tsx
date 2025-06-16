"use client"

import React, { useState } from "react"
import { ArrowLeft, BookOpen, Plus, Save, Tag, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Header from '@/components/Header'
import OrganizationGuard from '@/components/OrganizationGuard'
import { useNavigate } from 'react-router-dom'

const KnowledgeCreationPage = () => {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const navigate = useNavigate();

  // カテゴリ一覧（既存のコードから取得）
  const knowledgeCategories = [
    { id: 1, name: "業務プロセス" },
    { id: 2, name: "顧客対応" },
    { id: 3, name: "システム操作" },
    { id: 4, name: "技術情報" },
  ]

  // タグを追加する関数
  const addTag = () => {
    if (tagInput.trim() !== "" && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  // タグを削除する関数
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  // フォーム送信処理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // ここでナレッジベースのデータを保存する処理
    const newKnowledge = {
      title,
      category,
      description,
      content,
      tags,
      createdAt: new Date().toISOString()
    }
    
    
    // 実際にはここでAPIを呼び出しデータを保存する
    
    // フォームをリセット
    setTitle("")
    setCategory("")
    setDescription("")
    setContent("")
    setTags([])
  }

  return (
    <>
      <Header />
      <OrganizationGuard feature="ナレッジベース">
        <div className="p-6 bg-background min-h-screen">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-4 p-0 hover:bg-transparent"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            ダッシュボードに戻る
          </Button>
          <h1 className="text-2xl font-bold text-foreground">ナレッジベース作成</h1>
          <p className="text-muted-foreground">業務知識やノウハウの共有・蓄積ができます</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Editor Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  <BookOpen className="inline-block mr-2 h-5 w-5" />
                  ナレッジ詳細
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="title" className="block text-sm font-medium">
                      タイトル<span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="ナレッジのタイトルを入力"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="description" className="block text-sm font-medium">
                      概要<span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="ナレッジの概要を入力"
                      rows={2}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="content" className="block text-sm font-medium">
                      内容<span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="ナレッジの内容を入力"
                      rows={12}
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="submit" className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      保存
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Settings Sidebar */}
          <div className="space-y-6">
            {/* Category Card */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Tag className="inline-block mr-2 h-5 w-5" />
                  カテゴリー設定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="category" className="block text-sm font-medium">
                    カテゴリ<span className="text-red-500">*</span>
                  </label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="カテゴリを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {knowledgeCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="tags" className="block text-sm font-medium">
                    タグ
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="tagInput"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="タグを入力"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag()
                        }
                      }}
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                      >
                        <Tag className="mr-1 h-3 w-3" />
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 p-0"
                          onClick={() => removeTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2">
              <Button type="submit" onClick={handleSubmit}>
                <Save className="h-4 w-4 mr-2" />
                ナレッジを公開
              </Button>
              <Button variant="outline">
                下書きとして保存
              </Button>
            </div>
          </div>
        </div>

        {/* Tips Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              <BookOpen className="inline-block mr-2 h-5 w-5" />
              効果的なナレッジ作成のヒント
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start">
                <span className="font-medium mr-2">・</span>
                具体的な事例や手順を含め、実践的な内容を心がけましょう
              </li>
              <li className="flex items-start">
                <span className="font-medium mr-2">・</span>
                検索しやすいよう、適切なタグとカテゴリを設定しましょう
              </li>
              <li className="flex items-start">
                <span className="font-medium mr-2">・</span>
                定期的に内容を更新し、最新の情報を維持しましょう
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
      </OrganizationGuard>
    </>
  )
}

export default KnowledgeCreationPage
