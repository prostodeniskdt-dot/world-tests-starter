"use client";

import { useEffect, useState } from "react";
import { useLocalUser } from "./UserGate";

export function LoginModal() {
  const { user, handleTelegramAuth } = useLocalUser();
  const [loading, setLoading] = useState(false);
  const [botName, setBotName] = useState<string>("world_tests_bot");
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    if (user) {
      setShowModal(false);
    }
  }, [user]);

  useEffect(() => {
    // Получаем имя бота из конфига
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.telegramBotName) {
          setBotName(data.telegramBotName);
        }
      })
      .catch(() => {
        // Используем дефолтное значение при ошибке
      });
  }, []);

  useEffect(() => {
    // Инициализируем Telegram Login Widget
    if (typeof window !== "undefined" && !user && botName && showModal) {
      // Очищаем контейнер
      const container = document.getElementById("telegram-login-container");
      if (container) {
        container.innerHTML = "";
      }

      // Удаляем старые скрипты и виджеты
      const oldScript = document.querySelector('script[src*="telegram-widget.js"]');
      const oldIframe = document.querySelector('iframe[src*="oauth.telegram.org"]');
      if (oldScript) oldScript.remove();
      if (oldIframe) oldIframe.remove();

      // Небольшая задержка для очистки DOM
      setTimeout(() => {
        const script = document.createElement("script");
        script.src = "https://telegram.org/js/telegram-widget.js?22";
        script.setAttribute("data-telegram-login", botName);
        script.setAttribute("data-size", "large");
        script.setAttribute("data-onauth", "onTelegramAuth(user)");
        script.setAttribute("data-request-access", "write");
        script.async = true;
        
        if (container) {
          container.appendChild(script);
        }

        // Глобальная функция для обработки авторизации
        (window as any).onTelegramAuth = (telegramUser: any) => {
          setLoading(true);
          handleTelegramAuth(telegramUser).finally(() => {
            setLoading(false);
            setShowModal(false);
          });
        };
      }, 100);

      return () => {
        const existingScript = document.querySelector('script[src*="telegram-widget.js"]');
        const existingIframe = document.querySelector('iframe[src*="oauth.telegram.org"]');
        if (existingScript) existingScript.remove();
        if (existingIframe) existingIframe.remove();
        if ((window as any).onTelegramAuth) {
          delete (window as any).onTelegramAuth;
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, botName, showModal]);

  if (user || !showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Добро пожаловать в World Tests!
        </h2>
        <p className="text-zinc-600 mb-6 text-center">
          Для участия в тестах и рейтинге необходимо войти через Telegram.
        </p>
        {loading ? (
          <div className="text-center text-zinc-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mx-auto mb-2"></div>
            Обработка авторизации...
          </div>
        ) : (
          <div id="telegram-login-container" className="flex justify-center">
            {/* Telegram Login Widget будет вставлен сюда скриптом */}
          </div>
        )}
      </div>
    </div>
  );
}
