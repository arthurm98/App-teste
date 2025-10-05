
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const API_KEYS_STORAGE_KEY = "mangatrack-api-keys";

type ApiKeys = {
  mangaDex: string;
  kitsu: string;
  mangaUpdates: string;
  aniList: string;
};

export function ApiKeysSettings() {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    mangaDex: "",
    kitsu: "",
    mangaUpdates: "",
    aniList: "",
  });

  useEffect(() => {
    try {
      const savedKeys = window.localStorage.getItem(API_KEYS_STORAGE_KEY);
      if (savedKeys) {
        setApiKeys(JSON.parse(savedKeys));
      }
    } catch (error) {
      console.error("Erro ao carregar chaves de API do localStorage", error);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setApiKeys((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    try {
      window.localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(apiKeys));
      toast({
        title: "Chaves Salvas",
        description: "Suas chaves de API foram salvas com sucesso no dispositivo.",
      });
    } catch (error) {
      console.error("Erro ao salvar chaves de API no localStorage", error);
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: "Não foi possível salvar as chaves de API.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="mangaDex">MangaDex</Label>
        <Input
          id="mangaDex"
          name="mangaDex"
          type="password"
          placeholder="Chave da API do MangaDex"
          value={apiKeys.mangaDex}
          onChange={handleInputChange}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="kitsu">Kitsu</Label>
        <Input
          id="kitsu"
          name="kitsu"
          type="password"
          placeholder="Chave da API do Kitsu"
          value={apiKeys.kitsu}
          onChange={handleInputChange}
        />
      </div>
       <div className="space-y-2">
        <Label htmlFor="mangaUpdates">MangaUpdates</Label>
        <Input
          id="mangaUpdates"
          name="mangaUpdates"
          type="password"
          placeholder="Chave da API do MangaUpdates"
          value={apiKeys.mangaUpdates}
          onChange={handleInputChange}
        />
      </div>
       <div className="space-y-2">
        <Label htmlFor="aniList">AniList</Label>
        <Input
          id="aniList"
          name="aniList"
          type="password"
          placeholder="Chave da API do AniList"
          value={apiKeys.aniList}
          onChange={handleInputChange}
        />
      </div>
      <Button onClick={handleSave}>Salvar Chaves</Button>
    </div>
  );
}
