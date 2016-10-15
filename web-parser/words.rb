require 'nokogiri'
require 'net/http'
require "uri"
require 'yaml'

uri = URI.parse("https://quizlet.com/2832581/barrons-333-high-frequency-words-flash-cards/")
# save this response also to  file
response = Net::HTTP.get(uri)
page = Nokogiri::HTML(response)
words = []
page.xpath('//span[@class="TermText qWord lang-en"]/text()').each do |e|
  words << e.text()
end
meaning = []
page.xpath('//span[@class="TermText qDef lang-en"]/text()').each do |e|
meaning << e.text()
end
word_meaning = []
question_set = []
words.each_with_index do |val, index|
  word_meaning << { "word" => val, "meaning" => meaning[index] }
  options = []
  options << meaning[index]
  options += (meaning - options).sample(3)
  question_set << { "word" => val, "meaning" => meaning[index], "options" => options.shuffle}
end
word_file = File.new('words.yml', "w")
word_file.write(words.to_yaml)

word_file = File.new('meaning.yml', "w")
word_file.write(meaning.to_yaml)

word_meaning_file = File.new('word_meaning.yml', "w")
word_meaning_file.write(word_meaning.to_yaml)

question_set_file = File.new('question_set.yml', "w")
question_set_file.write(question_set.to_yaml)

# puts 'words'
# puts words.to_yaml
# puts 'meaning'
# puts meaning.to_yaml
