import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import ConversationClient from "./conversation-client";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export const metadata: Metadata = {
  title: "Conversation | ClimbTime",
  description: "Your private conversation",
};

type Message = {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
  receiverId: string;
  conversationId: string;
  read: boolean;
};

// Helper function to convert dates to strings in an object
const convertDatesToStrings = (obj: any) => {
  const newObj = { ...obj };
  Object.keys(newObj).forEach(key => {
    if (newObj[key] instanceof Date) {
      newObj[key] = newObj[key].toISOString();
    } else if (typeof newObj[key] === 'object' && newObj[key] !== null) {
      newObj[key] = convertDatesToStrings(newObj[key]);
    }
  });
  return newObj;
};

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }
  
  // Ensure params is awaited before using its properties
  const { conversationId } = await params;
  
  if (!conversationId) {
    notFound();
  }
  
  // Fetch conversation details
  const conversation = await prisma.conversation.findUnique({
    where: {
      id: conversationId,
    },
    include: {
      initiator: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      receiver: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });
  
  // Check if conversation exists and user is part of it
  if (
    !conversation ||
    (conversation.initiatorId !== session.user.id &&
      conversation.receiverId !== session.user.id)
  ) {
    notFound();
  }
  
  // Get the other user in the conversation
  const otherUser =
    conversation.initiatorId === session.user.id
      ? conversation.receiver
      : conversation.initiator;
  
  // Fetch messages
  const messages = await prisma.message.findMany({
    where: {
      conversationId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  
  // Mark unread messages as read
  if (messages.some((msg: Message) => msg.receiverId === session.user.id && !msg.read)) {
    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: session.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }
  
  // Convert dates to strings for client components
  const conversationWithStringDates = convertDatesToStrings(conversation);
  const messagesWithStringDates = messages.map((msg: Message) => convertDatesToStrings(msg));
  
  return (
    <div className="max-w-2xl mx-auto">
      <ConversationClient
        conversation={conversationWithStringDates}
        messages={messagesWithStringDates}
        currentUserId={session.user.id}
        otherUser={otherUser}
      />
    </div>
  );
} 