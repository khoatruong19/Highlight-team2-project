import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Homepage from './pages/home'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { Suspense } from 'react'
import {User} from "lucide-react"
import RankingBoard from './pages/play/components/ranking-board/RankingBoard'
import PlayingGameScreen from "@/pages/play";
// import { useTranslation } from "react-i18next";
// import AlertDialogYesNo from "@/common/components/AlertDialogYesNo";
// import { useTranslation } from 'react-i18next'
import PlayingGame from './pages/play-game'

const client = new QueryClient();

function App() {
  // const { i18n, t } = useTranslation();

  // const onChangeLang = (lang_code: "vn" | "en") => {
  //   i18n.changeLanguage(lang_code);
  // };

  return (
    <Suspense fallback="loading">
      <QueryClientProvider client={client}>
        {/* <h1 onClick={() => onChangeLang("vn")}>{t("playgame.board.ul")}</h1> */}
        {/* <AlertDialogYesNo
          buttonText="Click me!"
          buttonClassName="w-full"
          buttonVariant={"outline"}
          onYesClick={() => alert("Yes")}
        /> */}
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<Homepage />} />
            <Route path='/pbi4' element={<RankingBoard />} />
            <Route path="/" element={<Homepage />} />
            <Route path="/:roomId" element={<PlayingGameScreen />} />
            <Route path='/test' element={<PlayingGame/>} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </Suspense>
  );
}

export default App;
