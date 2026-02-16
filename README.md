# JSON to Markdown 

This package makes it easy to take JSON files and turn them into Markdown. 

Great for creating static site markdown out of API outputs. 

Take a titleProp, contentProp, path, and object and write a markdown file to the path with the object's data and content

@param   {str}  titleProp   The key to use as the title
@param   {str}  contentProp The key to use as the content
@param   {str}  pathString        The path to write the file to
@param   {obj}  obj         The object to write
@param   {bool}  neverOverwrite True to never overwrite an existing file

@return  {bool}             True if the file was written


