-- ─────────────────────────────────────────────────────────────────────────────
-- 62 deduped recipes from Greg Doucette — The Ultimate Anabolic Cookbook
-- (variants of the same base recipe collapsed; one entry per recipe).
-- 
-- WIPES the recipes table first then inserts. Run AFTER
-- 2025_recipes_and_meal_settings.sql.
-- ─────────────────────────────────────────────────────────────────────────────

TRUNCATE recipes;

INSERT INTO recipes
  (name, meal_types, calories, protein, carbs, fat, prep_minutes, dietary_tags, photo_url, ingredients, instructions)
VALUES
  ('Anabolic French Toast', ARRAY['breakfast']::text[], 350, 39, 31, 8, 15, ARRAY['vegetarian','high-protein']::text[], '', '[{"qty":"1","unit":"cup","name":"egg whites"},{"qty":"4","unit":"slices","name":"regular ass white"},{"qty":"","unit":"","name":"bread (up to 80 calories per"},{"qty":"","unit":"","name":"slice)"},{"qty":"1","unit":"packet","name":"sweetener"},{"qty":"1","unit":"tsp","name":"cinnamon"},{"qty":"1","unit":"tbsp","name":"vanilla extract"},{"qty":"0.5","unit":"cup","name":"blueberries"},{"qty":"0.5","unit":"cup","name":"low calorie syrup"}]'::jsonb, '1. In a bowl, add egg whites, sweetener, cinnamon, and vanilla extract. Whisk until spices are evenly distributed throughout the mixture.
2. Heat a griddle over low-medium heat. Spray griddle with cooking spray.
3. Dip P28 bread slices into egg white mixture, and transfer to pan.
4. Spoon any leftover egg white mixture into the bread in the pan. If done slowly, the bread should absorb the mixture and get fluffy.
5. Let cook for about 3-4 minutes on each side.
6. Remove French toast from the pan and serve on a plate with toppings. Suggestions for toppings are blueberries and low calorie syrup. (NOTE: toppings are NOT included in the estimated nutritional values).

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('French Toast Blueberry Pancakes', ARRAY['breakfast']::text[], 310, 33, 39, 3, 15, ARRAY['vegetarian','high-protein']::text[], '', '[{"qty":"2","unit":"cups","name":"egg whites"},{"qty":"4","unit":"slices","name":"regular ass white"},{"qty":"","unit":"","name":"bread (up to 80 calories per"},{"qty":"","unit":"","name":"slice)"},{"qty":"4","unit":"packs","name":"sweetener"},{"qty":"2","unit":"tsp","name":"cinnamon"},{"qty":"1","unit":"tbsp","name":"vanilla extract"},{"qty":"1.5","unit":"tsp","name":"guar/xanthan gum"},{"qty":"100","unit":"g","name":"blueberries"},{"qty":"0.5","unit":"cup","name":"low calorie syrup"}]'::jsonb, '1. In a blender, add bread slices, egg whites, guar/xantham gum, sweetener, vanilla extract, and cinnamon.
2. Blend on high until mixture is uniform in consistency. Remove mix from the blender and add to a fridge-safe airtight container.
3. (OPTIONAL): Let sit for 2-3 hours or more in the refrigerator. The longer you let the mixture rest, the better it binds. (Note: it can be cooked right away but it’s better if it has time to sit).
4. Heat a griddle over low-medium heat. Spray griddle with cooking spray. Add mixture to griddle and let sit for 1-2 minutes until edges appear cooked through.
5. Add blueberries to the pancake in the griddle.
6. Once edges start to brown and pancake appears to be visibly cooked about 2/3 of the way, flip the pancake in the griddle and let sit another 1-2 minutes.
7. Remove pancake from the griddle and serve on a plate with low calorie syrup or leftover blueberries.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Liquid Muscle Quick & Easy Pancakes', ARRAY['breakfast']::text[], 510, 95, 27, 2, 15, ARRAY['vegetarian','gluten-free','high-protein']::text[], '', '[{"qty":"500","unit":"g","name":"Liquid Muscle egg whites"},{"qty":"50","unit":"g","name":"casein protein"},{"qty":"4","unit":"packs","name":"of sweetener"},{"qty":"1/2","unit":"tsp","name":"baking powder or guar gum"},{"qty":"","unit":"","name":"(*use certified gluten-free guar gum"},{"qty":"","unit":"","name":"if you are following a gluten-free"},{"qty":"","unit":"","name":"diet)"}]'::jsonb, '1. In a bowl, mix egg whites, casein protein, sweetener, and baking powder/guar gum with a fork until a uniform consistency is achieved.
2. Heat a griddle over low-medium heat. Spray griddle with cooking spray. Add mixture to griddle and let sit for 1-2 minutes until edges appear cooked through.
3. Remove pancake from the griddle and serve on a plate with toppings of choice. (*NOTE: Estimated nutritional values do NOT include the toppings!)

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Apple Protein Pancakes', ARRAY['breakfast']::text[], 166, 15, 24, 2, 15, ARRAY['vegetarian','gluten-free']::text[], '', '[{"qty":"2","unit":"cups","name":"egg whites"},{"qty":"3/4","unit":"cup","name":"(65g) rolled oats (*use"},{"qty":"","unit":"","name":"certified gluten-free guar gum if you"},{"qty":"","unit":"","name":"are following a gluten-free diet)"},{"qty":"1/2","unit":"cup","name":"0% fat cottage cheese"},{"qty":"450","unit":"g","name":"apples"},{"qty":"1/2","unit":"tbsp","name":"cinnamon"},{"qty":"5","unit":"","name":"sweetener packets"},{"qty":"2","unit":"tsp","name":"guar gum (*use certified"}]'::jsonb, '1. Blend all ingredients for 30 seconds or until a uniform consistency is achieved.
2. (OPTIONAL) Transfer blended mixture to an airtight container, and let sit in refrigerator for 4 hours. (Note: these can be eaten right away, but it is preferable to let the batter thicken over a few hours).
3. Heat a griddle over low-medium heat. Spray griddle with cooking spray. Add mixture to griddle and let sit for 1-2 minutes until edges appear cooked through.
4. Remove pancake from the griddle and serve on a plate with toppings of choice. (NOTE: Estimated nutritional values do NOT include toppings). Vegetarian Gluten-Free

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Banana Protein Pancakes', ARRAY['breakfast']::text[], 178, 15, 26, 2, 15, ARRAY['vegetarian','gluten-free']::text[], '', '[{"qty":"2","unit":"cups","name":"egg whites"},{"qty":"3/4","unit":"cup","name":"(65g) rolled oats (*use certified"}]'::jsonb, '1. Blend all ingredients for 30 seconds or until a uniform consistency is achieved.
2. (OPTIONAL) Transfer blended mixture to an airtight container, and let sit in refrigerator for 4 hours. (Note: these can be eaten right away, but it is preferable to let the batter thicken over a few hours).
3. Heat a griddle over low-medium heat. Spray griddle with cooking spray. Add mixture to griddle and let sit for 1-2 minutes until edges appear cooked through.
4. Remove pancake from the griddle and serve on a plate with toppings of choice. (NOTE: Estimated nutritional values do NOT include toppings). Vegetarian Gluten-Free Makes 5 servings Prep Time: 10 min. | Cook Time: 10 min. If you’ve ever wanted to combine the deliciousness of pancakes, bananas foster, and GAINS, look no further than this extraordinary recipe for banana protein pancakes.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Hamburger', ARRAY['lunch']::text[], 630, 58, 53, 19, 15, ARRAY['high-protein']::text[], '', '[{"qty":"2","unit":"slices","name":"regular ass white bread (up"},{"qty":"","unit":"","name":"to 80 calories per slice)"},{"qty":"150","unit":"g","name":"strained extra lean ground"},{"qty":"","unit":"","name":"beef (96% lean)"},{"qty":"","unit":"","name":"Can of gravy (up to 50 calories)"},{"qty":"1","unit":"","name":"serving veggies (up to 100"}]'::jsonb, '1. Form a patty with the ground beef, salt and pepper (and any other seasonings to taste such as: cumin, parsley, chili flakes, etc).
2. Heat a griddle over low-medium heat. Spray griddle with cooking spray. Add lean ground beef patty to pan and cook on both sides until it is “medium” doneness.
3. Separately, heat up gravy in a microwaveable bowl.
4. Stack veggies and patty on bread with optional ketchup and mustard. Add gravy to the top of the patty. Hamburger is ready to eat. (*NOTE: Estimated nutrition values do NOT include condiments).

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Chicken Burger', ARRAY['lunch']::text[], 660, 76, 52, 14, 15, ARRAY['high-protein']::text[], '', '[{"qty":"2","unit":"slices","name":"regular ass white bread (up"},{"qty":"","unit":"","name":"to 80 calories per slice)"},{"qty":"200","unit":"g","name":"chicken breast"},{"qty":"","unit":"","name":"Can of gravy (up to 50 calories)"},{"qty":"1","unit":"","name":"serving veggies (up to 100"}]'::jsonb, '1. Optionally marinade chicken overnight with seasonings to taste.
2. Heat a griddle over low-medium heat. Spray griddle with cooking spray. Add chicken breast to pan and cook on both sides until it is “medium” doneness.
3. Separately, heat up gravy in a microwaveable bowl.
4. Stack veggies and chicken on bread with optional ketchup and mustard. Burger is ready to eat. (*NOTE: Estimated nutrition values do NOT include condiments).

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Grilled Cheese Sandwich', ARRAY['lunch']::text[], 410, 38, 34, 14, 15, ARRAY['vegetarian','high-protein']::text[], '', '[{"qty":"2","unit":"slices","name":"ICON Meals"}]'::jsonb, '1. Heat a griddle over low heat, and add low-calorie butter to pan.
2. Add 2 slices of bread to the pan and add cheese on top.
3. Eat as a closed sandwich or as two open face sides, whichever you prefer.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Ham and Cheese', ARRAY['lunch']::text[], 395, 46, 28, 11, 15, ARRAY['high-protein']::text[], '', '[{"qty":"2","unit":"slices","name":"bread of your choice"},{"qty":"60-80","unit":"g","name":"sliced ham"},{"qty":"1-2","unit":"slices","name":"low-fat cheese"},{"qty":"1","unit":"tbsp","name":"mustard"}]'::jsonb, '1. Toast bread to your preference.
2. Layer ham and low-fat cheese on one slice.
3. Add mustard and a low-cal sauce. Top with second slice.
4. Optional: grill in a non-stick pan until cheese melts.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Chicken/Tuna, Lettuce, Tomato Sandwich', ARRAY['lunch']::text[], 380, 43, 32, 9, 15, ARRAY['high-protein']::text[], '', '[{"qty":"2","unit":"slices","name":"bread of your choice"},{"qty":"80-100","unit":"g","name":"grilled chicken or tuna"},{"qty":"2-3","unit":"leaves","name":"lettuce"},{"qty":"2-3","unit":"slices","name":"tomato"}]'::jsonb, '1. Toast bread.
2. Layer sliced grilled chicken or drained tuna, lettuce, sliced tomato.
3. Add mustard or low-cal sauce. Top with second slice.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Peanut Butter Banana PB2 Sandwich', ARRAY['lunch']::text[], 447, 35, 55, 9, 15, ARRAY['vegetarian','high-protein']::text[], '', '[{"qty":"2","unit":"slices","name":"ICON Meals"}]'::jsonb, '1. Toast bread slices in the toaster until it has a light brown crisp.
2. Mix PB2 powder in a bowl with 1 tbsp water (or more or less depending on desired thickness), and stir until an even consistency is achieved.
3. Spread PB2 mixture on the bread slices. Then add sliced banana. Eat as a closed sandwich or as two open face sides, whichever you prefer. Enjoy!

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('PB2 and Jam Sandwich', ARRAY['lunch']::text[], 391, 36, 42, 9, 15, ARRAY['vegetarian','high-protein']::text[], '', '[{"qty":"2","unit":"slices","name":"ICON Meals"}]'::jsonb, '1. Toast bread slices in the toaster until they have a light brown crisp.
2. Mix PB2 powder in a bowl with 1 tbsp water (or more or less depending on desired thickness), and stir until an even consistency is achieved.
3. Spread PB2 mixture on the bread slices. Then add sliced banana. Eat as a closed sandwich or as two open face sides, whichever you prefer. Enjoy!

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Toufayan Beef Wrap', ARRAY['lunch']::text[], 310, 31, 29, 10, 15, ARRAY['high-protein']::text[], '', '[{"qty":"1","unit":"","name":"wrap of your choice"},{"qty":"80-100","unit":"g","name":"extra lean ground beef"},{"qty":"0.5","unit":"serving","name":"veggies (spinach, lettuce, onion, peppers)"},{"qty":"1","unit":"tbsp","name":"Walden Farms mustard or low-cal sauce"}]'::jsonb, '1. Heat a frying pan over medium heat. Add cooking spray.
2. Cook the ground beef until fully done; drain excess fat.
3. Lay wrap flat. Spread mustard or hot sauce, layer beef, veggies, optional cheese.
4. Roll tightly, slice, serve.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Tumaro''s Chicken Wrap', ARRAY['lunch']::text[], 330, 43, 32, 7, 15, ARRAY['high-protein']::text[], '', '[{"qty":"1","unit":"","name":"wrap of your choice"},{"qty":"80-100","unit":"g","name":"grilled chicken breast"},{"qty":"0.5","unit":"serving","name":"veggies"},{"qty":"1","unit":"tbsp","name":"mustard or low-cal sauce"}]'::jsonb, '1. Lay wrap flat. Spread mustard or hot sauce.
2. Layer cooked chicken breast, veggies, optional cheese.
3. Roll tightly, slice, serve.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Tumaro''s Turkey Wrap', ARRAY['lunch']::text[], 300, 32, 32, 10, 15, ARRAY['high-protein']::text[], '', '[{"qty":"1","unit":"","name":"wrap of your choice"},{"qty":"80-100","unit":"g","name":"extra lean ground turkey"},{"qty":"0.5","unit":"serving","name":"veggies"},{"qty":"1","unit":"tbsp","name":"mustard or low-cal sauce"}]'::jsonb, '1. Cook extra lean ground turkey with seasoning.
2. Lay wrap flat. Spread mustard, layer turkey, veggies, optional cheese.
3. Roll, slice, serve.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Joseph''s Flax, Oat Bran & Whole Wheat Lavash with Egg Whites Wrap', ARRAY['lunch']::text[], 310, 34, 28, 6, 15, ARRAY['vegetarian','high-protein']::text[], '', '[]'::jsonb, 'From Greg Doucette — The Ultimate Anabolic Cookbook (#CHEFGREG), page 31. See your purchased copy for ingredients and step-by-step directions.'),
  ('Toufayan Egg White Wrap', ARRAY['lunch']::text[], 280, 32, 30, 6, 15, ARRAY['vegetarian','high-protein']::text[], '', '[{"qty":"1","unit":"","name":"wrap of your choice"},{"qty":"1/3 – 1/2","unit":"cup","name":"egg whites"},{"qty":"0.5","unit":"serving","name":"veggies (spinach, mushroom, onion)"}]'::jsonb, '1. Heat a pan with cooking spray, pour in egg whites, cook with veggies.
2. Lay wrap flat, add cooked egg whites, optional cheese, sauce.
3. Roll, slice, serve.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('NuPasta Chicken Stirfry', ARRAY['dinner']::text[], 555, 65, 48, 9, 15, ARRAY['vegetarian','high-protein']::text[], '', '[{"qty":"1","unit":"","name":"package of NuPasta (35"}]'::jsonb, '1. Cook NuPasta according to package instructions, and set aside.
2. Heat a pan over medium heat. Spray pan with cooking spray. Add veggies and chicken to pan and sauté until it is cooked through. Add spices to taste.
3. Add cooked nupasta and pasta sauce to the pan and sauté all together for a few minutes.
4. Serve and eat altogether in a bowl.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Pedon MORE THAN Pasta With Tomato Beef Sauce', ARRAY['dinner']::text[], 580, 42, 83, 9, 15, ARRAY['vegetarian','high-protein']::text[], '', '[{"qty":"50","unit":"g","name":"Pedon MORE THAN Pasta"},{"qty":"","unit":"","name":"(or equivalent up to 165 cal)"},{"qty":"1/4","unit":"cup","name":"Simply Natural"},{"qty":"","unit":"","name":"Organic Tomato & Basil Pasta"},{"qty":"","unit":"","name":"Sauce (or equivalent, up to 30"}]'::jsonb, '1. Boil 4 quarts of water with salt over high heat. Once water starts to boil, reduce heat to medium to bring the water to a simmer. Add the Pedon MORE THAN pasta and cook per the pasta instructions. Strain when done cooking and apply cold water. Let sit.
2. Separately, heat a griddle over low-medium heat. Spray griddle with cooking spray. Add lean ground beef to pan and cook on both sides until it is cooked through. Add spices to taste.
3. Heat up tomato sauce in a microwaveable bowl.
4. Serve and eat pasta, meat, and sauce together.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Pedon MORE THAN Pasta With Chicken Tomato Sauce', ARRAY['dinner']::text[], 585, 48, 83, 7, 15, ARRAY['vegetarian','high-protein']::text[], '', '[{"qty":"50","unit":"g","name":"Pedon MORE THAN Pasta"},{"qty":"","unit":"","name":"(or equivalent up to 165 cal)"},{"qty":"1/4","unit":"cup","name":"Simply Natural"},{"qty":"","unit":"","name":"Organic Tomato & Basil Pasta"},{"qty":"","unit":"","name":"Sauce (or equivalent, up to"},{"qty":"","unit":"","name":"30cal)"},{"qty":"45","unit":"g","name":"chicken breast"},{"qty":"1/4","unit":"","name":"serving veggies (up to 25"}]'::jsonb, '1. Boil 4 quarts of water with salt over high heat. Once water starts to boil, reduce heat to medium to bring the water to a simmer. Add the Pedon MORE THAN pasta and cook per the pasta instructions. Strain when done cooking and apply cold water. Let sit.
2. Separately, heat a griddle over low-medium heat. Spray griddle with cooking spray. Add chicken breast to pan and cook on both sides until it is cooked through. Add spices to taste.
3. Heat up tomato sauce in a microwaveable bowl.
4. Serve and eat pasta, chicken, and sauce together.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Organic Black Bean Zeroodle Chicken Fettuccine', ARRAY['dinner']::text[], 650, 74, 62, 11, 15, ARRAY['vegetarian','high-protein']::text[], '', '[{"qty":"1/6","unit":"","name":"package (33g) Zeroodle"},{"qty":"","unit":"","name":"(or pasta equivalent up to 120"}]'::jsonb, '1. Boil 4 quarts of water with salt over high heat. Once water starts to boil, reduce heat to medium to bring the water to a simmer. Add the Zeroodle pasta and cook per the pasta instructions. Strain when done cooking and apply cold water. Let sit.
2. Separately, heat a griddle over low-medium heat. Spray griddle with cooking spray. Add chicken breast to pan and cook on both sides until it is cooked through. Add spices to taste.
3. Heat up tomato sauce and veggies in a microwaveable bowl.
4. Serve and eat pasta, chicken, and sauce together.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Organic Black Bean Zeroodle Beef Fettuccine', ARRAY['dinner']::text[], 640, 66, 62, 14, 15, ARRAY['vegetarian','high-protein']::text[], '', '[{"qty":"1/6","unit":"","name":"package (33g) Zeroodle"},{"qty":"","unit":"","name":"(or pasta equivalent up to 120"}]'::jsonb, '1. Boil 4 quarts of water with salt over high heat. Once water starts to boil, reduce heat to medium to bring the water to a simmer. Add the Zeroodle pasta and cook per the pasta instructions. Strain when done cooking and apply cold water. Let sit.
2. Separately, heat a griddle over low-medium heat. Spray griddle with cooking spray. Add ground beef to pan and sauté until it is cooked through. Add spices to taste.
3. Heat up tomato sauce and veggies in a microwaveable bowl.
4. Serve and eat pasta, beef, and sauce together.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Organic Black Bean Zeroodle Tofu Fettuccine', ARRAY['dinner']::text[], 620, 58, 65, 14, 15, ARRAY['vegan','vegetarian','gluten-free','high-protein']::text[], '', '[{"qty":"1/6","unit":"","name":"package (33g) Zeroodle"},{"qty":"","unit":"","name":"(or pasta equivalent up to 120"}]'::jsonb, '1. Boil 4 quarts of water with salt over high heat. Once water starts to boil, reduce heat to medium to bring the water to a simmer. Add the Zeroodle pasta and cook per the pasta instructions. Strain when done cooking and apply cold water. Let sit.
2. Separately, heat a griddle over low-medium heat. Spray griddle with cooking spray. Add cubed tofu to pan and sauté until it is cooked through. Add spices to taste.
3. Heat up tomato sauce and veggies in a microwaveable bowl.
4. Serve and eat pasta, tofu, and sauce together.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Ciao Carb Proto Pasta Beef Tomato Sauce', ARRAY['dinner']::text[], 600, 84, 40, 11, 15, ARRAY['high-protein']::text[], '', '[]'::jsonb, 'From Greg Doucette — The Ultimate Anabolic Cookbook (#CHEFGREG), page 45. See your purchased copy for ingredients and step-by-step directions.'),
  ('Ciao Carb Proto Pasta Tofu Tomato Sauce', ARRAY['dinner']::text[], 580, 76, 43, 11, 15, ARRAY['vegetarian','gluten-free','high-protein']::text[], '', '[]'::jsonb, 'From Greg Doucette — The Ultimate Anabolic Cookbook (#CHEFGREG), page 46. See your purchased copy for ingredients and step-by-step directions.'),
  ('Protein P28 Pizza with Bison', ARRAY['dinner']::text[], 625, 69, 49, 17, 15, ARRAY['high-protein']::text[], '', '[]'::jsonb, 'From Greg Doucette — The Ultimate Anabolic Cookbook (#CHEFGREG), page 48. See your purchased copy for ingredients and step-by-step directions.'),
  ('"Golden Home" Protein Pizza With Beef', ARRAY['dinner']::text[], 275, 20, 39, 4, 15, ARRAY[]::text[], '', '[{"qty":"1","unit":"","name":"“Golden Home” Ultra Thin Protein"},{"qty":"","unit":"","name":"pizza crust"},{"qty":"1","unit":"slice","name":"fat free Kraft cheese slice"},{"qty":"35","unit":"g","name":"extra lean ground beef"},{"qty":"3","unit":"tbsp","name":"pizza sauce (25 calories)"},{"qty":"","unit":"","name":"Toppings of choice: peppers / onions /"},{"qty":"","unit":"","name":"mushrooms / spinach"}]'::jsonb, '1. Heat a frying pan over medium heat. Add cooking spray and sauté onions, mushrooms, and peppers until fully cooked through. Add ground bison and sauté until fully cooked.
2. Toast FLATOUT pizza crust in oven at 300 degrees Fahrenheit on a baking sheet for 3 minutes. Remove from oven and let sit for a few minutes.
3. Add all ingredients to the pizza crust with cheese slice on top and place in oven for another 3 minutes. Click here to order Golden Home Ultra Thin Pizza Crusts!

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Cauliflower Mashed Potatoes', ARRAY['dinner']::text[], 150, 5, 33, 0, 15, ARRAY['vegetarian','gluten-free']::text[], '', '[{"qty":"2","unit":"","name":"lbs potatoes"},{"qty":"2","unit":"","name":"lbs cauliflower florets"},{"qty":"1","unit":"cup","name":"fat-free sour cream"},{"qty":"3","unit":"","name":"tsp. guar gum or Xanthan"},{"qty":"","unit":"","name":"gum"},{"qty":"2","unit":"","name":"tsp. baking powder"},{"qty":"","unit":"","name":"Spices to taste"}]'::jsonb, '1. Boil 4 quarts of water with salt over high heat. Once water starts to boil, reduce heat to medium to bring the water to a simmer. Add the potatoes and leave in pot until fully cooked through. Drain in a colander and add to Ninja blender.
2. Separately, cook cauliflower in a boiling pot of water. Drain in a colander and add to Ninja blender.
3. Add baking powder, spices, 1/2 cup fat-free sour cream, and guar gum to Ninja blender and pulse blend until smooth.
4. Service with remaining fat-free sour cream and any preferred spices.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Protein "Chips and Guacamole"', ARRAY['snack']::text[], 210, 12, 28, 11, 15, ARRAY['vegetarian','gluten-free']::text[], '', '[{"qty":"1","unit":"","name":"Flatout Protein UP Flatbread (110"}]'::jsonb, '1. Slice an avocado into cubes. Dice tomatos, onions, and jalapenos. Place all in one bowl and mash with a spoon or a pestel. Add lime, salt and pepper to taste.
2. Place Flatout ProteinUP wrap on a baking sheet. Slice wrap into squares approximately 1.5 inches on each side. Put in toaster oven for 3 minutes until the pieces are crispy like tortilla chips.
3. Serve together as an appetizer or as a delicious healthy snack. Vegan Vegetarian Makes 1 serving Prep Time: 5 min. | Ready in: 5 min Like dining at Mexican restaurants with the unlimited salsa, chips, and guacamole, but also like your gains? Look no further than this modified version of chips and guacamole!

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Protein PB2 Chocolate Bar', ARRAY['snack']::text[], 235, 25, 47, 3, 15, ARRAY['vegetarian']::text[], '', '[{"qty":"7","unit":"scoops","name":"RYSE chocolate peanut"},{"qty":"","unit":"","name":"butter cup whey protein powder"},{"qty":"1","unit":"","name":"1/3 cup Liquid Vitafiber /"}]'::jsonb, '1. Microwave liquid Vitafiber/Fiber Yum in a bowl until bubbles start to form (about 30 seconds on high).
2. Remove bowl from microwave and add remaining ingredients. Mix all the ingredients together with a spoon until you achieve a sticky, doughy consistency.
3. Spread mixture onto a silicone tray and transfer to a freezer. Pro Tip: To help transfer the gooey mixture, Greg recommends that you spray one of your fingers with cooking spray to help to evenly distribute across the tray.
4. After about 1 hour in the freezer, remove the tray and let sit at room temperature for 5 minutes. Slice the batch into portion sizes of choice (for reference on the nutrition by portion size, see the nutrition table at the top right of this page). Wrap individual pieces in wax paper and return them to the freezer.
5. Chocolate bars should remain in the freezer until they are ready to be eaten. Eat within 5 minutes of removing from the freezer for best results. Vegetarian Gluten-Free Entire Batch Large Piece Medium Piece Small Piece

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Holiday Chocolate Protein Bar', ARRAY['snack']::text[], 250, 25, 48, 4, 15, ARRAY['vegetarian']::text[], '', '[]'::jsonb, 'From Greg Doucette — The Ultimate Anabolic Cookbook (#CHEFGREG), page 55. See your purchased copy for ingredients and step-by-step directions.'),
  ('Banana Fiber One Chocolate Protein Bar', ARRAY['snack']::text[], 241, 23, 56, 3, 15, ARRAY['vegetarian']::text[], '', '[{"qty":"7","unit":"scoops","name":"RYSE chocolate peanut butter"},{"qty":"","unit":"","name":"whey protein powder (*choose a"}]'::jsonb, '1. Microwave liquid Vitafiber/Fiber Yum in a bowl until bubbles start to form (about 1 minute on high).
2. Remove bowl from microwave and add remaining ingredients. Mix all the ingredients together with a spoon until you achieve a sticky, doughy consistency.
3. Spread mixture onto a silicone tray and transfer to a freezer. Pro Tip: To help transfer the gooey mixture, Greg recommends that you spray one of your fingers with cooking spray to help to evenly distribute across the tray.
4. After about 1 hour in the freezer, remove the tray and let sit at room temperature for 5 minutes. Slice the batch into portion sizes of choice (for reference on the nutrition by portion size, see the nutrition table). Wrap individual pieces in wax paper and return them to the freezer.
5. Chocolate bars should remain in the freezer until they are ready to be eaten. Eat within 5 minutes of removing from the freezer for best results. Vegetarian Gluten-Free Makes 1 batch (8 large pieces / 12 medium pieces / 18 small pieces / 30 bite size pieces) Prep Time: 20 min. | Ready in: 2 hrs. Like banana splits but also like your shreds? Try out this delicious banana, chocolate, peanut butter medley chocolate bar. If you have a batch of these sitting in your freezer at any given time, you can reach in and grab one of these when you’re thinking about the delicious flavors of banana, chocolate, and peanut butter. If you are following a vegan diet, choose a vegan protein powder with chocolate and peanut butter flavors. Click to order RYSE chocolate peanut butter cup whey protein. Use the code DOCGREG at checkout for 15% off your purchase! Entire Batch Large Piece Medium Piece Small Piece Bite Size Piece

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Special K Banana Crunch Chocolate Protein Bar', ARRAY['snack']::text[], 279, 26, 60, 3, 15, ARRAY['vegetarian']::text[], '', '[{"qty":"7","unit":"scoops","name":"RYSE chocolate peanut butter"},{"qty":"","unit":"","name":"whey protein powder"},{"qty":"1","unit":"","name":"1/3 cup Liquid Vitafiber/Fiber Yum"},{"qty":"200","unit":"g","name":"overripe banana"},{"qty":"110","unit":"g","name":"Special K Protein Cereal"}]'::jsonb, '1. Microwave liquid Vitafiber/Fiber Yum in a bowl until bubbles start to form (about 30 seconds on high).
2. Remove bowl from microwave and add remaining ingredients. Mix all the ingredients together with a spoon until you achieve a sticky, doughy consistency.
3. Spread mixture onto a silicone tray and transfer to a freezer. Pro Tip: To help transfer the gooey mixture, Greg recommends that you spray one of your fingers with cooking spray to help to evenly distribute across the tray.
4. After about 1 hour in the freezer, remove the tray and let sit at room temperature for 5 minutes. Slice the batch into portion sizes of choice (for reference on the nutrition by portion size, see the nutrition table). Wrap individual pieces in wax paper and return them to the freezer.
5. Chocolate bars should remain in the freezer until they are ready to be eaten. Eat within 5 minutes of removing from the freezer for best results. Vegetarian Makes 1 batch (8 large pieces / 12 medium pieces / 18 small pieces / 30 bite size pieces) Prep Time: 20 min. | Ready in: 2 hrs. Click to order RYSE chocolate peanut butter cup whey protein. Use the code DOCGREG at checkout for 15% off your purchase! Entire Batch Large Piece Medium Piece Small Piece Bite Size Piece

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Caramel Protein Chocolate Bar', ARRAY['snack']::text[], 221, 25, 44, 3, 15, ARRAY['vegetarian']::text[], '', '[{"qty":"8","unit":"scoops","name":"RYSE Chocolate Peanut"},{"qty":"","unit":"","name":"Butter Cup protein powder"},{"qty":"1","unit":"","name":"1/3 cup Liquid Vitafiber / Fiber"},{"qty":"","unit":"","name":"Yum"},{"qty":"1/2","unit":"cup","name":"Walden Farms Caramel/"},{"qty":"","unit":"","name":"Chocolate Syrup"},{"qty":"1","unit":"tsp","name":"imitation caramel extract"}]'::jsonb, '1. Microwave liquid Vitafiber/Fiber Yum in a bowl until bubbles start to form (about 30 seconds on high).
2. Remove bowl from microwave and add remaining ingredients. Mix all the ingredients together with a spoon until you achieve a sticky, doughy consistency.
3. Spread mixture onto a silicone tray and transfer to a freezer. Pro Tip: To help transfer the gooey mixture, Greg recommends that you spray one of your fingers with cooking spray to help to evenly distribute across the tray.
4. After about 1 hour in the freezer, remove the tray and let sit at room temperature for 5 minutes. Slice the batch into portion sizes of choice (for reference on the nutrition by portion size, see the nutrition table). Wrap individual pieces in wax paper and return them to the freezer.
5. Chocolate protein bars should remain in the freezer until they are ready to be eaten. Vegetarian Entire Batch Large Piece Medium Piece Small Piece Bite Size Piece

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Skor Protein Bar', ARRAY['snack']::text[], 248, 25, 47, 4, 15, ARRAY['vegetarian']::text[], '', '[{"qty":"310","unit":"g","name":"(8 scoops) RYSE Chocolate"},{"qty":"","unit":"","name":"Peanut Butter Cup Protein powder"},{"qty":"450","unit":"g","name":"Liquid Vitafiber / Fiber Yum"},{"qty":"1/3","unit":"cup","name":"Walden Farms Caramel/"},{"qty":"","unit":"","name":"Chocolate Syrup"},{"qty":"4","unit":"tbsp","name":"cocoa powder"},{"qty":"39","unit":"g","name":"Skor chipits (toffee bits)"},{"qty":"1","unit":"tsp","name":"imitation caramel extract"}]'::jsonb, '1. Microwave liquid Vitafiber/Fiber Yum in a bowl until bubbles start to form (about 30 seconds on high).
2. Remove bowl from microwave and add remaining ingredients. Mix all the ingredients together with a spoon until you achieve a sticky, doughy consistency.
3. Spread mixture onto a silicone tray and transfer to a freezer. Pro Tip: To help transfer the gooey mixture, Greg recommends that you spray one of your fingers with cooking spray to help to evenly distribute across the tray.
4. After about 1 hour in the freezer, remove the tray and let sit at room temperature for 5 minutes. Slice the batch into portion sizes of choice (for reference on the nutrition by portion size, see the nutrition table). Wrap individual pieces in wax paper and return them to the freezer.
5. Chocolate protein bars should remain in the freezer until they are ready to be eaten. Entire Batch Large Piece Medium Piece Small Piece Bite Size Piece

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Eva Dunbar''s Coconut Power Protein Bar', ARRAY['snack']::text[], 300, 29, 55, 5, 15, ARRAY['vegetarian']::text[], '', '[{"qty":"8","unit":"scoops","name":"RYSE chocolate peanut butter"},{"qty":"","unit":"","name":"cup protein powder"},{"qty":"1","unit":"","name":"1/3 cup Liquid Vitafiber/Fiber Yum"},{"qty":"30","unit":"g","name":"unsweetened coconut fine flakes"},{"qty":"4","unit":"tbsp","name":"cocoa powder"},{"qty":"110","unit":"g","name":"Special K Protein Cereal (*choose"},{"qty":"","unit":"","name":"a gluten-free cereal if you are following"},{"qty":"","unit":"","name":"a vegan diet!)"},{"qty":"1","unit":"tsp","name":"imitation coconut extract"},{"qty":"0.5","unit":"tsp","name":"lemon rind"}]'::jsonb, '1. Microwave liquid Vitafiber/Fiber Yum in a bowl until bubbles start to form (about 30 seconds on high).
2. Remove bowl from microwave and add remaining ingredients. Mix all the ingredients together with a spoon until you achieve a sticky, doughy consistency.
3. Spread mixture onto a silicone tray and transfer to a freezer. Pro Tip: To help transfer the gooey mixture, Greg recommends that you spray one of your fingers with cooking spray to help to evenly distribute across the tray.
4. After about 1 hour in the freezer, remove the tray and let sit at room temperature for 5 minutes. Slice the batch into portion sizes of choice (for reference on the nutrition by portion size, see the nutrition table). Wrap individual pieces in wax paper and return them to the freezer.
5. Chocolate protein bars should remain in the freezer until they are ready to be eaten. Vegetarian Entire Batch Large Piece Medium Piece Small Piece Bite Size Piece

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('PB2 Chocolate Chip Protein Cookies', ARRAY['snack']::text[], 218, 19, 34, 5, 15, ARRAY['vegetarian']::text[], '', '[]'::jsonb, 'From Greg Doucette — The Ultimate Anabolic Cookbook (#CHEFGREG), page 61. See your purchased copy for ingredients and step-by-step directions.'),
  ('PB2 Chocolate Chip Banana Protein Cookies', ARRAY['snack']::text[], 225, 19, 35, 5, 15, ARRAY['vegetarian']::text[], '', '[{"qty":"2","unit":"scoops","name":"(77g) RYSE Peanut Butter"},{"qty":"","unit":"","name":"Chocolate Whey Protein"},{"qty":"60","unit":"g","name":"Vitafiber/Fiber Yum sugar-free"},{"qty":"","unit":"","name":"sweetener"},{"qty":"60","unit":"g","name":"rolled oats"},{"qty":"24","unit":"g","name":"PB2"},{"qty":"24","unit":"g","name":"cocoa powder"},{"qty":"1/3","unit":"cup","name":"unsweetened almond milk"},{"qty":"10","unit":"","name":"packets sweetener"},{"qty":"1/4","unit":"tsp","name":"baking powder"},{"qty":"30","unit":"g","name":"overripe banana"},{"qty":"1/4","unit":"cup","name":"Walden Farms chocolate syrup"},{"qty":"16","unit":"g","name":"chocolate chips"}]'::jsonb, '1. Pre-heat oven to 375 degrees Fahrenheit.
2. Grind rolled oats in a blender until they are a powdery consistency.
3. Combine and mix all dry ingredients in a large bowl with a whisk.
4. Combine almond milk and VitaFiber in a bowl. Stir and then heat in the microwave on high for 45 seconds.
5. Add banana and Walden Farms chocolate syrup to the almond milk / VitaFiber bowl and mix with a whisk.
6. Add all wet ingredients to the dry ingredients bowl. Stir until a uniform pasty consistency has been achieved.
7. Spray a baking sheet with cooking spray and create 4-8 cookies with batter (depending on desired portion size - see nutrition chart for reference to determine desired portion size).
8. Place cookie sheet in oven and cook for 12 minutes.
9. Remove from oven and let stand until cookies have achieved desired eating temperature. Eat warm or cold, whichever you like! Vegetarian Entire Batch Large Cookie Medium Cookie Small Cookie

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Cottage Cheese Protein Pudding - Chocolate', ARRAY['snack']::text[], 99, 8, 14, 1, 15, ARRAY['vegetarian']::text[], '', '[{"qty":"2","unit":"cups","name":"0/% fat cottage cheese"},{"qty":"4.5","unit":"cups","name":"unsweetened almond milk"},{"qty":"2","unit":"scoops","name":"RYSE chocolate peanut butter cup"},{"qty":"","unit":"","name":"whey protein"},{"qty":"1","unit":"","name":"package of fat-free Jell-O chocolate"},{"qty":"","unit":"","name":"pudding (120 calories)"},{"qty":"","unit":"","name":"1.5-2 tbsp guar/xanthan gum"},{"qty":"10","unit":"","name":"packets of sweetener"},{"qty":"","unit":"","name":"Optional Substitutions"},{"qty":"2","unit":"scoops","name":"casein protein instead of RYSE"},{"qty":"","unit":"","name":"whey protein"}]'::jsonb, '1. Add all ingredients to a blender. Blend for 3 minutes on medium-high speed until there is a smooth consistency. Note that the more casein protein is used, the thicker the pudding will be.
2. Remove pudding from blender and transfer to an airtight refrigerator safe container. Pudding is ready to eat. Makes 9 servings

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Apple Goop', ARRAY['snack']::text[], 93, 1, 22, 1, 15, ARRAY['vegan','vegetarian','gluten-free']::text[], '', '[{"qty":"1/2","unit":"cup","name":"rolled oats"},{"qty":"500","unit":"g","name":"apples"},{"qty":"6","unit":"","name":"packets sweetener"},{"qty":"3","unit":"tsp","name":"guar gum (*use certified"}]'::jsonb, '1. Chop apples into medium cubes.
2. Add apples, oats, sweetener, and cinnamon to a large microwave-safe bowl and toss with a fork.
3. Blend water and guar gum on high for 15 seconds.
4. Add blended water and guar gum mixture to the microwave-safe container, and stir all ingredients with a fork.
5. Place the bowl in the microwave and heat on high. Remove the bowl from the microwave and add water and stir as needed until apples are very soft. Vegetarian Gluten-Free Vegan Makes 4 servings Ready in: 5 min.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Fat-Free Chocolate Jell-O Protein Pudding', ARRAY['snack']::text[], 209, 23, 25, 2, 15, ARRAY['vegetarian']::text[], '', '[{"qty":"1.5","unit":"cups","name":"lactose-free protein milk (120"}]'::jsonb, '1. Add all ingredients to a blender. Blend for 3 minutes on medium-high speed until there is a smooth consistency..
2. Remove pudding from blender and transfer to an airtight refrigerator safe container. Pudding is ready to eat. Makes 2 servings Prep Time: 2 min. | Ready in: 6 min.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Cottage Cheese Chocolate PB2 Delight', ARRAY['snack']::text[], 102, 11, 10, 2, 15, ARRAY['vegetarian']::text[], '', '[{"qty":"2","unit":"cups","name":"0% fat free cottage cheese"},{"qty":"3","unit":"cups","name":"unsweetened almond milk (90 calories)"},{"qty":"1","unit":"scoop","name":"RYSE chocolate peanut butter cup"},{"qty":"","unit":"","name":"whey protein powder"},{"qty":"24","unit":"g","name":"PB2 (or equivalent powdered peanut butter)"},{"qty":"1","unit":"packet","name":"of fat-free sugar-free Jell-O chocolate"},{"qty":"","unit":"","name":"pudding (120 calories)"},{"qty":"","unit":"","name":"1.5-2 tbsp guar/xanthan gum"},{"qty":"14","unit":"g","name":"unsweetened cocoa powder"},{"qty":"10","unit":"","name":"packets sweetener (to taste)"}]'::jsonb, '1. Add all ingredients to a blender. Blend for 3 minutes on medium-high speed until there is a smooth consistency. Note that the more casein protein is used, the thicker the pudding will be.
2. Remove pudding from blender and transfer to an airtight refrigerator safe container. Pudding is ready to eat.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Dairy Dream Protein Dessert with Cottage Cheese', ARRAY['snack']::text[], 195, 25, 18, 0, 15, ARRAY['vegetarian','gluten-free','low-carb']::text[], '', '[{"qty":"1/2","unit":"cup","name":"fat-free cottage cheese"},{"qty":"1/2","unit":"cup","name":"Liquid Muscle Egg Whites (flavor"},{"qty":"","unit":"","name":"of choice)"},{"qty":"1/2","unit":"","name":"serving fruit (up to 50 calories)"}]'::jsonb, '1. Add all ingredients to a bowl, with cottage cheese at the bottom, then Liquid Muscle egg whites, then fruit.
2. Dessert is ready to eat. Makes 1 small serving Ready in: 2 min.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Protein Chocolate Lava Cake', ARRAY['snack']::text[], 175, 32, 5, 3, 15, ARRAY['vegetarian','high-protein','low-carb']::text[], '', '[{"qty":"5","unit":"scoops","name":"RYSE chocolate peanut butter"},{"qty":"","unit":"","name":"cup whey protein powder"},{"qty":"40","unit":"g","name":"cocoa powder"},{"qty":"1","unit":"cup","name":"egg whites"},{"qty":"1/2","unit":"cup","name":"water"},{"qty":"3","unit":"","name":"packets sweetener"},{"qty":"1","unit":"","name":"tsp. guar/xanthan gum"}]'::jsonb, '1. In a large bowl, add liquid ingredients and whisk for 30 seconds. Add dry ingredients and continue to whisk batter until an even consistency has been achieved
2. Spray a large microwaveable mug or soup bowl with cooking spray for 1 second.
3. Add batter to the microwaveable mug / soup bowl, and microwave on high for 35 seconds, or until center is gooey and sides appear cooked like a brownie. You do not want to overcook this. The center should be gooey when done.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Chocolate Strawberry Almond Proteinsicles', ARRAY['snack']::text[], 196, 25, 18, 3, 15, ARRAY['vegetarian','low-carb']::text[], '', '[{"qty":"1","unit":"cup","name":"unsweetened almond"},{"qty":"","unit":"","name":"milk"},{"qty":"3.5","unit":"scoops","name":"RYSE chocolate"},{"qty":"","unit":"","name":"peanut butter cup whey"}]'::jsonb, '1. Add all ingredients to a blender. Pulse blend on medium-high speed until there is a smooth consistency. You will likely need to take a spoon and push the ingredients down a few times. Note that the more casein protein is used, the thicker the pudding will be.
2. Remove pudding from blender and transfer across 4 popsicle trays. Transfer to a freezer. (*NOTE: Popsicle trays vary in size, so please be sure that you are doing your homework and dividing the total batch calories/ macros into the amount of trays you have. So if this entire batch makes 6 trays, then divide the calories, fats, carbs, fiber, and protein by 6 to know how much one serving is). Makes 1 large batch (approx. 4 large servings)

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Chocolate Strawberry PB2 Proteinsicles', ARRAY['snack']::text[], 303, 45, 21, 5, 15, ARRAY['vegetarian','high-protein']::text[], '', '[{"qty":"1.5","unit":"cups","name":"ice water"},{"qty":"140","unit":"g","name":"frozen strawberries"},{"qty":"5","unit":"scoops","name":"RYSE chocolate"},{"qty":"","unit":"","name":"peanut butter cup whey"}]'::jsonb, '1. Add all ingredients to a blender. Pulse blend on medium-high speed until there is a smooth consistency. You will likely need to take a spoon and push the ingredients down a few times. Note that the more casein protein is used, the thicker the pudding will be.
2. Remove pudding from blender and transfer across 4 popsicle trays. Transfer to a freezer. (*NOTE: Popsicle trays vary in size, so please be sure that you are doing your homework and dividing the total batch calories/ macros into the amount of trays you have. So if this entire batch makes 6 trays, then divide the calories, fats, carbs, fiber, and protein by 6 to know how much one serving is). Makes 1 large batch (approx. 4 large servings)

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Vanilla Berry Proteinsicles', ARRAY['snack']::text[], 255, 38, 21, 3, 15, ARRAY['vegetarian','high-protein']::text[], '', '[{"qty":"1","unit":"scoop","name":"whey protein"},{"qty":"100-150","unit":"g","name":"frozen fruit"},{"qty":"1/2","unit":"cup","name":"unsweetened almond milk or 0% Greek yogurt"}]'::jsonb, '1. Blend whey, frozen fruit, milk/yogurt, sweetener until smooth.
2. Pour into popsicle molds, insert sticks.
3. Freeze at least 4 hours (overnight ideal).

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Strawberry Cheesecake Proteinsicles', ARRAY['snack']::text[], 289, 40, 23, 4, 15, ARRAY['vegetarian','high-protein']::text[], '', '[{"qty":"1","unit":"scoop","name":"whey protein"},{"qty":"100-150","unit":"g","name":"frozen fruit"},{"qty":"1/2","unit":"cup","name":"unsweetened almond milk or 0% Greek yogurt"}]'::jsonb, '1. Blend whey, frozen fruit, milk/yogurt, sweetener until smooth.
2. Pour into popsicle molds, insert sticks.
3. Freeze at least 4 hours (overnight ideal).

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Blueberry Protein Shake', ARRAY['breakfast','snack']::text[], 185, 26, 14, 3, 15, ARRAY['vegetarian','low-carb']::text[], '', '[{"qty":"1-2","unit":"scoop","name":"whey or casein protein"},{"qty":"100-200","unit":"g","name":"frozen fruit"},{"qty":"1/3-2/3","unit":"cup","name":"unsweetened almond milk"},{"qty":"1","unit":"tsp","name":"guar/xanthan gum"},{"qty":"1-2","unit":"packets","name":"sweetener"},{"qty":"","unit":"","name":"Ice"}]'::jsonb, '1. Add ice to blender.
2. Add protein powder, frozen fruit, almond milk, sweetener, guar/xanthan gum.
3. Blend on high until smooth. For pudding texture, add 0.5 cup 0% Greek yogurt.
4. Pour into glass/bowl; optional sugar-free syrup or PB2 drizzle.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Chocolate Blueberry PB2 Protein Shake', ARRAY['breakfast','snack']::text[], 575, 75, 51, 10, 15, ARRAY['vegetarian','high-protein']::text[], '', '[{"qty":"1-2","unit":"scoop","name":"whey or casein protein"},{"qty":"100-200","unit":"g","name":"frozen fruit"},{"qty":"1/3-2/3","unit":"cup","name":"unsweetened almond milk"},{"qty":"1","unit":"tsp","name":"guar/xanthan gum"},{"qty":"1-2","unit":"packets","name":"sweetener"},{"qty":"","unit":"","name":"Ice"}]'::jsonb, '1. Add ice to blender.
2. Add protein powder, frozen fruit, almond milk, sweetener, guar/xanthan gum.
3. Blend on high until smooth. For pudding texture, add 0.5 cup 0% Greek yogurt.
4. Pour into glass/bowl; optional sugar-free syrup or PB2 drizzle.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Strawberry Protein Shake', ARRAY['breakfast','snack']::text[], 220, 27, 18, 5, 15, ARRAY['vegetarian','low-carb']::text[], '', '[{"qty":"1-2","unit":"scoop","name":"whey or casein protein"},{"qty":"100-200","unit":"g","name":"frozen fruit"},{"qty":"1/3-2/3","unit":"cup","name":"unsweetened almond milk"},{"qty":"1","unit":"tsp","name":"guar/xanthan gum"},{"qty":"1-2","unit":"packets","name":"sweetener"},{"qty":"","unit":"","name":"Ice"}]'::jsonb, '1. Add ice to blender.
2. Add protein powder, frozen fruit, almond milk, sweetener, guar/xanthan gum.
3. Blend on high until smooth. For pudding texture, add 0.5 cup 0% Greek yogurt.
4. Pour into glass/bowl; optional sugar-free syrup or PB2 drizzle.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Strawberry Protein Pudding Shake', ARRAY['breakfast','snack']::text[], 520, 71, 46, 8, 15, ARRAY['vegetarian','high-protein']::text[], '', '[{"qty":"1-2","unit":"scoop","name":"whey or casein protein"},{"qty":"100-200","unit":"g","name":"frozen fruit"},{"qty":"1/3-2/3","unit":"cup","name":"unsweetened almond milk"},{"qty":"1","unit":"tsp","name":"guar/xanthan gum"},{"qty":"1-2","unit":"packets","name":"sweetener"},{"qty":"","unit":"","name":"Ice"}]'::jsonb, '1. Add ice to blender.
2. Add protein powder, frozen fruit, almond milk, sweetener, guar/xanthan gum.
3. Blend on high until smooth. For pudding texture, add 0.5 cup 0% Greek yogurt.
4. Pour into glass/bowl; optional sugar-free syrup or PB2 drizzle.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Chocolate PB2 Protein Shake', ARRAY['breakfast','snack']::text[], 385, 56, 23, 8, 15, ARRAY['vegetarian','high-protein']::text[], '', '[{"qty":"1-2","unit":"scoop","name":"whey or casein protein"},{"qty":"100-200","unit":"g","name":"frozen fruit"},{"qty":"1/3-2/3","unit":"cup","name":"unsweetened almond milk"},{"qty":"1","unit":"tsp","name":"guar/xanthan gum"},{"qty":"1-2","unit":"packets","name":"sweetener"},{"qty":"","unit":"","name":"Ice"}]'::jsonb, '1. Add ice to blender.
2. Add protein powder, frozen fruit, almond milk, sweetener, guar/xanthan gum.
3. Blend on high until smooth. For pudding texture, add 0.5 cup 0% Greek yogurt.
4. Pour into glass/bowl; optional sugar-free syrup or PB2 drizzle.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Chocolate Protein Pudding Shake', ARRAY['breakfast','snack']::text[], 255, 34, 22, 4, 15, ARRAY['vegetarian','high-protein']::text[], '', '[{"qty":"1-2","unit":"scoop","name":"whey or casein protein"},{"qty":"100-200","unit":"g","name":"frozen fruit"},{"qty":"1/3-2/3","unit":"cup","name":"unsweetened almond milk"},{"qty":"1","unit":"tsp","name":"guar/xanthan gum"},{"qty":"1-2","unit":"packets","name":"sweetener"},{"qty":"","unit":"","name":"Ice"}]'::jsonb, '1. Add ice to blender.
2. Add protein powder, frozen fruit, almond milk, sweetener, guar/xanthan gum.
3. Blend on high until smooth. For pudding texture, add 0.5 cup 0% Greek yogurt.
4. Pour into glass/bowl; optional sugar-free syrup or PB2 drizzle.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Vanilla PB2 Protein Pudding Shake', ARRAY['breakfast','snack']::text[], 355, 44, 28, 8, 15, ARRAY['vegetarian','high-protein']::text[], '', '[{"qty":"1-2","unit":"scoop","name":"whey or casein protein"},{"qty":"100-200","unit":"g","name":"frozen fruit"},{"qty":"1/3-2/3","unit":"cup","name":"unsweetened almond milk"},{"qty":"1","unit":"tsp","name":"guar/xanthan gum"},{"qty":"1-2","unit":"packets","name":"sweetener"},{"qty":"","unit":"","name":"Ice"}]'::jsonb, '1. Add ice to blender.
2. Add protein powder, frozen fruit, almond milk, sweetener, guar/xanthan gum.
3. Blend on high until smooth. For pudding texture, add 0.5 cup 0% Greek yogurt.
4. Pour into glass/bowl; optional sugar-free syrup or PB2 drizzle.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Blueberry Chocolate PB2 Pudding Shake', ARRAY['breakfast','snack']::text[], 540, 74, 47, 8, 15, ARRAY['vegetarian','high-protein']::text[], '', '[{"qty":"1-2","unit":"scoop","name":"whey or casein protein"},{"qty":"100-200","unit":"g","name":"frozen fruit"},{"qty":"1/3-2/3","unit":"cup","name":"unsweetened almond milk"},{"qty":"1","unit":"tsp","name":"guar/xanthan gum"},{"qty":"1-2","unit":"packets","name":"sweetener"},{"qty":"","unit":"","name":"Ice"}]'::jsonb, '1. Add ice to blender.
2. Add protein powder, frozen fruit, almond milk, sweetener, guar/xanthan gum.
3. Blend on high until smooth. For pudding texture, add 0.5 cup 0% Greek yogurt.
4. Pour into glass/bowl; optional sugar-free syrup or PB2 drizzle.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Vanilla Protein Pudding Shake', ARRAY['breakfast','snack']::text[], 430, 54, 39, 6, 15, ARRAY['vegetarian','high-protein']::text[], '', '[{"qty":"1-2","unit":"scoop","name":"whey or casein protein"},{"qty":"100-200","unit":"g","name":"frozen fruit"},{"qty":"1/3-2/3","unit":"cup","name":"unsweetened almond milk"},{"qty":"1","unit":"tsp","name":"guar/xanthan gum"},{"qty":"1-2","unit":"packets","name":"sweetener"},{"qty":"","unit":"","name":"Ice"}]'::jsonb, '1. Add ice to blender.
2. Add protein powder, frozen fruit, almond milk, sweetener, guar/xanthan gum.
3. Blend on high until smooth. For pudding texture, add 0.5 cup 0% Greek yogurt.
4. Pour into glass/bowl; optional sugar-free syrup or PB2 drizzle.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Sweet Chocolate Pudding Shake', ARRAY['breakfast','snack']::text[], 260, 34, 19, 5, 15, ARRAY['vegetarian','high-protein','low-carb']::text[], '', '[{"qty":"1-2","unit":"scoop","name":"whey or casein protein"},{"qty":"100-200","unit":"g","name":"frozen fruit"},{"qty":"1/3-2/3","unit":"cup","name":"unsweetened almond milk"},{"qty":"1","unit":"tsp","name":"guar/xanthan gum"},{"qty":"1-2","unit":"packets","name":"sweetener"},{"qty":"","unit":"","name":"Ice"}]'::jsonb, '1. Add ice to blender.
2. Add protein powder, frozen fruit, almond milk, sweetener, guar/xanthan gum.
3. Blend on high until smooth. For pudding texture, add 0.5 cup 0% Greek yogurt.
4. Pour into glass/bowl; optional sugar-free syrup or PB2 drizzle.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)'),
  ('Sweet Greek Chocolate Pudding Shake', ARRAY['breakfast','snack']::text[], 250, 33, 22, 3, 15, ARRAY['vegetarian','high-protein']::text[], '', '[{"qty":"1-2","unit":"scoop","name":"whey or casein protein"},{"qty":"100-200","unit":"g","name":"frozen fruit"},{"qty":"1/3-2/3","unit":"cup","name":"unsweetened almond milk"},{"qty":"1","unit":"tsp","name":"guar/xanthan gum"},{"qty":"1-2","unit":"packets","name":"sweetener"},{"qty":"","unit":"","name":"Ice"}]'::jsonb, '1. Add ice to blender.
2. Add protein powder, frozen fruit, almond milk, sweetener, guar/xanthan gum.
3. Blend on high until smooth. For pudding texture, add 0.5 cup 0% Greek yogurt.
4. Pour into glass/bowl; optional sugar-free syrup or PB2 drizzle.

— From Greg Doucette, "The Ultimate Anabolic Cookbook" (#CHEFGREG)');
