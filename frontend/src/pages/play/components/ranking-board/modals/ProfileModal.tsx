import { Button } from "@/common/components/ui/Button"
import {
    DialogContent,
    DialogFooter,
    DialogHeader,
} from "@/common/components/ui/Modal"
import { Label } from "@/common/components/ui/label"
import { Ban, ThumbsDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/common/components/ui/avatar"

type Props = {
    user: any
}

export function DialogDemo({ user }: Props) {

    return (
        <DialogContent className="sm:w-[425px]">
            <DialogHeader>
                <div className="flex items-center justify-center gap-5 w-full">
                    <img className="w-4/5 h-fit" src="src/common/assets/ProfileLabel.png" alt="avatar" />
                </div>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center gap-5 w-full py-5">
                {/* <div className="flex items-center justify-center w-full">
                    <img className="w-40 h-40 rounded-full" src={user?.img} alt="avatar" />
                </div> */}
                <Avatar className="flex items-center bg-yellow-300 w-1/3 h-auto rounded-full">
                    <AvatarImage src={user?.img} alt="avatar" />
                    <AvatarFallback>Avatar</AvatarFallback>
                </Avatar>

                <div className="flex items-center justify-center w-full">
                    <Label htmlFor="name" className="text-lg font-medium text-truncate dark:text-white">
                        {user?.name}
                    </Label>
                </div>
            </div>
            <DialogFooter>
                <div className="flex flex-col items-center justify-center gap-5 w-full">
                    <div className="flex items-center justify-center w-full">
                        <Button className="rounded-l-full rounded-r-full ring-8 ring-black bg-yellow-600 hover:bg-yellow-200 text-white"><ThumbsDown size={24} color="#000" strokeWidth={4} className="mr-1" />VOTE KICK</Button>
                    </div>
                    <div className="flex items-center justify-center w-full">
                        <Button variant="destructive" className="rounded-l-full rounded-r-full ring-8 ring-black bg-red-700 hover:bg-red-600 text-white"><Ban size={24} color="#000" strokeWidth={4} className="mr-5" />BLOCKS</Button>
                    </div>
                </div>
            </DialogFooter>
        </DialogContent>
    )
}