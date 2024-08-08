import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { inventory } = await request.json();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Generate four recipes using some of these ingredients: ${inventory.map(item => item.name).join(', ')}. For each recipe, provide:
1. A title prefixed with "###"
2. Prep time
3. A list of ingredients (including quantities)
4. Numbered preparation steps
5. A blank line between each recipe

After the last recipe, add the line: "Feel free to adjust the seasoning and portion sizes to suit your tastes! Enjoy your cooking!"

Do not include any other text or formatting.`,
        },
      ],
    });

    const recipesText = response.choices[0].message.content;
    console.log('recipesText:', recipesText);
    

    const recipes = recipesText.split('###')
      .filter(recipe => recipe.trim() !== '')
      .map((recipe, index)  => {
        const lines = recipe.trim().split('\n');
        const fullTitle = `${index + 1}. ${lines[0].trim()}`;
        const title = lines[0].trim();
        const prepTime = lines.find(line => line.toLowerCase().includes('prep time:'))?.split(':')[1].trim() || 'Unknown';
        const ingredientsStart = lines.findIndex(line => line.toLowerCase().includes('ingredients:'));
        const preparationStart = lines.findIndex(line => line.toLowerCase().includes('preparation:'));
        const ingredients = lines.slice(ingredientsStart + 1, preparationStart)
          .filter(line => line.trim() !== '')
          .map(line => line.trim().replace(/^-\s*/, ''));
        const preparation = lines.slice(preparationStart + 1)
          .filter(line => line.trim() !== '')
          .map(line => line.trim().replace(/^\d+\.\s*/, ''));

        return {
          fullTitle, // This will be used for display
          title,     // This will be used for saving to Firebase
          prepTime,
          ingredients,
          preparation,
        };
      });

    const message = "Feel free to adjust the seasoning and portion sizes to suit your tastes! Enjoy your cooking!";

    return NextResponse.json({ recipes, message });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
  }
}




