import { Button } from '../ui/button';

export function PageHeader() {
  return (
    <div className="border p-2 rounded-md flex flex-col gap-4">
      <h1 className="text-lg font-medium">Administrer dine ansatte</h1>
      <div className="flex">
        <p className="flex-2">
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quae ducimus, accusamus beatae neque eum esse
          maxime. In, eius fugit sequi minus hic culpa quod esse nobis iste quo sunt laudantium!
        </p>
        <div className="flex-1 flex justify-end items-center">
          <Button>Du er en neger</Button>
        </div>
      </div>
    </div>
  );
}
