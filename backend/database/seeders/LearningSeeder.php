<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\Lesson;
use App\Models\ContentBlock;
use Illuminate\Database\Seeder;

class LearningSeeder extends Seeder
{
    public function run(): void
    {
        // Disable foreign key checks to allow truncation
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        // Truncate tables to ensure fresh start
        \App\Models\LessonProgress::truncate();
        ContentBlock::truncate();
        Lesson::truncate();
        Module::truncate();
        
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // ---------------------------------------------------------------------
        // Module 1: English Basics
        // ---------------------------------------------------------------------
        $module = Module::create([
            'title' => 'English Basics',
            'slug' => 'english-basics',
            'description' => 'Master the fundamentals of English conversation, grammar, and vocabulary.',
            'thumbnail_url' => 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80',
            'difficulty' => 'beginner',
            'category' => 'General',
            'order_index' => 1,
            'is_published' => true,
        ]);

        // Lesson 1.1: Greetings
        $this->createLesson($module, [
            'title' => 'Introduction to Greetings',
            'slug' => 'intro-to-greetings',
            'description' => 'Learn how to say hello and introduce yourself in different situations.',
            'estimated_mins' => 5,
            'order_index' => 1,
            'total_blocks' => 7,
            'required_blocks' => 2,
            'completion_criteria' => ['min_interactive' => 2],
            'blocks' => [
                ['type' => 'text', 'is_required' => false, 'content' => ['style' => 'normal', 'html' => '<h2 class="text-2xl font-bold mb-4">Welcome!</h2><p>Greetings are the first step to starting a conversation. Let\'s learn the basics.</p>']],
                ['type' => 'image', 'is_required' => false, 'content' => ['url' => 'https://images.unsplash.com/photo-1516575334481-f85287c2c81d?auto=format&fit=crop&q=80', 'caption' => 'A friendly handshake.', 'alt' => 'Handshake']],
                ['type' => 'divider', 'is_required' => false, 'content' => ['style' => 'line']],
                ['type' => 'vocabulary', 'is_required' => true, 'content' => ['word' => 'Hello', 'translation' => 'Halo', 'example_sentence' => 'Hello, nice to meet you!', 'pronunciation' => '/həˈləʊ/']],
                ['type' => 'text', 'is_required' => false, 'content' => ['style' => 'tip', 'html' => '<p><strong>Tip:</strong> "Hi" is casual, "Hello" is neutral.</p>']],
                ['type' => 'quiz_mc', 'is_required' => true, 'content' => ['question' => 'Which is a formal greeting?', 'options' => ['Hi', 'Good Morning', 'Yo'], 'correct_index' => 1, 'explanation' => '"Good Morning" is polite and formal.']],
                ['type' => 'quiz_typing', 'is_required' => true, 'content' => ['question' => 'Type the word for "Halo" in English', 'correct_answer' => 'Hello', 'tolerance' => 'normal']],
            ]
        ]);

        // Lesson 1.2: Self Introduction
        $this->createLesson($module, [
            'title' => 'Self Introduction',
            'slug' => 'self-introduction',
            'description' => 'Learn to introduce your name, origin, and job.',
            'estimated_mins' => 8,
            'order_index' => 2,
            'total_blocks' => 8,
            'required_blocks' => 3,
            'completion_criteria' => ['min_interactive' => 3],
            'blocks' => [
                ['type' => 'text', 'is_required' => false, 'content' => ['style' => 'normal', 'html' => '<h2 class="text-2xl font-bold">Introducing Yourself</h2><p>When meeting someone new, you usually say your name and where you are from.</p>']],
                ['type' => 'vocabulary', 'is_required' => true, 'content' => ['word' => 'My name is...', 'translation' => 'Nama saya adalah...', 'example_sentence' => 'My name is Sarah.', 'pronunciation' => '/maɪ neɪm ɪz/']],
                ['type' => 'vocabulary', 'is_required' => true, 'content' => ['word' => 'I am from...', 'translation' => 'Saya berasal dari...', 'example_sentence' => 'I am from Indonesia.', 'pronunciation' => '/aɪ æm frɒm/']],
                ['type' => 'quiz_mc', 'is_required' => true, 'content' => ['question' => 'How do you say "Nama saya John"?', 'options' => ['I name John', 'My name is John', 'Me John'], 'correct_index' => 1, 'explanation' => 'Use "My name is" followed by your name.']],
                ['type' => 'divider', 'is_required' => false, 'content' => ['style' => 'dots']],
                ['type' => 'vocabulary', 'is_required' => true, 'content' => ['word' => 'Student', 'translation' => 'Murid/Mahasiswa', 'example_sentence' => 'I am a university student.', 'pronunciation' => '/ˈstjuːdənt/']],
                ['type' => 'quiz_typing', 'is_required' => true, 'content' => ['question' => 'Translate: "Saya berasal dari Bali"', 'correct_answer' => 'I am from Bali', 'tolerance' => 'flexible']],
                ['type' => 'text', 'is_required' => false, 'content' => ['style' => 'highlight', 'html' => '<p>Great job! You can now introduce yourself simply.</p>']],
            ]
        ]);

        // ---------------------------------------------------------------------
        // Module 2: Daily Conversation (Ordering Coffee)
        // ---------------------------------------------------------------------
        $module2 = Module::create([
            'title' => 'Daily Conversation',
            'slug' => 'daily-conversation',
            'description' => 'Real-world scenarios like ordering food, asking directions, and shopping.',
            'thumbnail_url' => 'https://images.unsplash.com/photo-1542379373-d48e23e75525?auto=format&fit=crop&q=80', // Coffee shop image
            'difficulty' => 'intermediate',
            'category' => 'Lifestyle',
            'order_index' => 2,
            'is_published' => true,
        ]);

        // Lesson 2.1: At the Coffee Shop
        $this->createLesson($module2, [
            'title' => 'Ordering a Coffee',
            'slug' => 'ordering-coffee',
            'description' => 'Learn how to order your favorite drink at a cafe.',
            'estimated_mins' => 10,
            'order_index' => 1,
            'total_blocks' => 9,
            'required_blocks' => 4,
            'completion_criteria' => ['min_interactive' => 3],
            'blocks' => [
                ['type' => 'image', 'is_required' => false, 'content' => ['url' => 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80', 'caption' => 'A barista making coffee.', 'alt' => 'Coffee Shop']],
                ['type' => 'text', 'is_required' => false, 'content' => ['style' => 'normal', 'html' => '<h2 class="text-2xl font-bold">At the Cafe</h2><p>Ordering coffee requires specific vocabulary about sizes, types, and preferences.</p>']],
                ['type' => 'vocabulary', 'is_required' => true, 'content' => ['word' => 'I would like...', 'translation' => 'Saya ingin...', 'example_sentence' => 'I would like a cappuccino, please.', 'pronunciation' => '/aɪ wʊd laɪk/']],
                ['type' => 'vocabulary', 'is_required' => true, 'content' => ['word' => 'To go / Takeaway', 'translation' => 'Dibungkus / Bawa pulang', 'example_sentence' => 'Can I have it to go?', 'pronunciation' => '/tə ɡəʊ/']],
                ['type' => 'text', 'is_required' => false, 'content' => ['style' => 'tip', 'html' => '<p><strong>Culture Note:</strong> In the US, they say "to go". In the UK/Australia, they often say "takeaway".</p>']],
                ['type' => 'quiz_mc', 'is_required' => true, 'content' => ['question' => 'Which phrase is polite?', 'options' => ['I want coffee', 'Give me coffee', 'I would like a coffee'], 'correct_index' => 2, 'explanation' => '"I would like" is much more polite than "I want".']],
                ['type' => 'divider', 'is_required' => false, 'content' => ['style' => 'line']],
                ['type' => 'text', 'is_required' => false, 'content' => ['style' => 'normal', 'html' => '<h3 class="text-lg font-bold">Dialogue Practice</h3><p><strong>Barista:</strong> "Hi, what can I get for you?"<br><strong>You:</strong> "Hi, I would like a small latte, please."<br><strong>Barista:</strong> "For here or to go?"<br><strong>You:</strong> "To go, thanks."</p>']],
                ['type' => 'quiz_typing', 'is_required' => true, 'content' => ['question' => 'Type the polite way to say "Saya ingin latte"', 'correct_answer' => 'I would like a latte', 'tolerance' => 'flexible']],
            ]
        ]);

        // Update module counts
        $module->update(['lessons_count' => 2]);
        $module2->update(['lessons_count' => 1]);
    }

    private function createLesson($module, $data)
    {
        $lesson = Lesson::create([
            'module_id' => $module->id,
            'title' => $data['title'],
            'slug' => $data['slug'],
            'description' => $data['description'],
            'estimated_mins' => $data['estimated_mins'],
            'order_index' => $data['order_index'],
            'difficulty' => $data['difficulty'] ?? $module->difficulty,
            'total_blocks' => $data['total_blocks'],
            'required_blocks' => $data['required_blocks'],
            'completion_criteria' => $data['completion_criteria'] ?? [],
            'is_published' => true,
        ]);

        foreach ($data['blocks'] as $index => $blockData) {
            ContentBlock::create([
                'lesson_id' => $lesson->id,
                'type' => $blockData['type'],
                'content' => $blockData['content'],
                'is_required' => $blockData['is_required'],
                'order_index' => $index + 1
            ]);
        }
    }
}
